import { useChat } from "@ai-sdk/react";
import type { Message, Thread, User } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { GoogleSignIn } from "./components/GoogleSignIn";
import { ThreadDetail } from "./components/ThreadDetail";
import { ThreadList } from "./components/ThreadList";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [_threadTitles, _setThreadTitles] = useState<Record<string, string>>({});
  const currentThreadIdRef = useRef<string | null>(null);

  const { messages, sendMessage: originalSendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: () => {
        const token = localStorage.getItem("auth_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        return headers;
      },
      body: () => ({
        threadId: currentThreadIdRef.current,
      }),
    }),
  });
  const [input, setInput] = useState("");

  // Fetch all threads
  const fetchThreads = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/threads", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      }
    } catch (error) {
      console.error("Error fetching threads:", error);
    }
  };

  // Load thread history
  const loadThreadHistory = async (threadId: string) => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistoricalMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading thread history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Switch to a different thread
  const switchToThread = async (threadId: string) => {
    currentThreadIdRef.current = threadId;
    window.history.pushState(null, "", `/threads/${threadId}`);
    await loadThreadHistory(threadId);
  };

  // Create a new thread
  const createThread = async (): Promise<string> => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch("/api/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // No title for now
    });

    if (!response.ok) {
      throw new Error("Failed to create thread");
    }

    const data = await response.json();
    return data.thread.id;
  };

  // Custom sendMessage that handles thread creation
  const sendMessage = async (message: { text: string }) => {
    try {
      // If no current thread, create one
      if (!currentThreadIdRef.current) {
        const threadId = await createThread();
        currentThreadIdRef.current = threadId;
        console.log("Created new thread:", threadId);

        // Update URL to include threadId
        window.history.pushState(null, "", `/threads/${threadId}`);

        // Refresh thread list to include the new thread
        await fetchThreads();

        // Clear historical messages since this is a new thread
        setHistoricalMessages([]);
      }

      // Send the message using the original function
      originalSendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      setAuthError("Failed to send message. Please try again.");
    }
  };

  const handleSignIn = async (userData: User) => {
    setUser(userData);
    setAuthError(null);
    console.log("User signed in:", userData);

    // Fetch threads after sign in
    await fetchThreads();
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setAuthError(null);
    currentThreadIdRef.current = null; // Reset thread on sign out
    setThreads([]); // Clear threads
    setHistoricalMessages([]); // Clear historical messages
    // Reset URL to home
    window.history.pushState(null, "", "/");
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
    console.error("Auth error:", error);
  };

  const handleNewThread = () => {
    currentThreadIdRef.current = null;
    setHistoricalMessages([]);
    window.history.pushState(null, "", "/");
  };

  // Check for existing token on mount and URL threadId
  useEffect(() => {
    // Check for threadId in URL
    const path = window.location.pathname;
    const threadMatch = path.match(/^\/threads\/(.+)$/);
    if (threadMatch) {
      const threadId = threadMatch[1];
      currentThreadIdRef.current = threadId;
      console.log("Loaded thread from URL:", threadId);
    }

    const checkExistingAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          // Verify token by calling a simple API
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);

            // Fetch threads after successful authentication
            await fetchThreads();

            // If there's a threadId in URL, load its history
            if (currentThreadIdRef.current) {
              await loadThreadHistory(currentThreadIdRef.current);
            }
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("auth_token");
        }
      }
    };

    checkExistingAuth();
  }, []);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        height: "100vh",
        display: "flex",
      }}
    >
      {/* Sidebar */}
      {user && (
        <ThreadList
          threads={threads}
          currentThreadId={currentThreadIdRef.current}
          onThreadSelect={switchToThread}
          onNewThread={handleNewThread}
        />
      )}

      {/* Main Content */}
      {!user ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header for non-authenticated users */}
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0 }}>Ocha</h1>
            <div>
              <GoogleSignIn onSignIn={handleSignIn} onError={handleAuthError} />
              {authError && (
                <p style={{ color: "red", marginTop: 8, fontSize: "0.9em" }}>
                  {authError}
                </p>
              )}
            </div>
          </div>

          {/* Sign-in prompt */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                textAlign: "center",
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                padding: 32,
                maxWidth: 400,
              }}
            >
              <p style={{ color: "#666", fontSize: "1.1em", marginBottom: 16 }}>
                Please sign in with Google to start chatting with the AI
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ThreadDetail
          user={user}
          historicalMessages={historicalMessages}
          currentMessages={messages}
          isLoadingHistory={isLoadingHistory}
          currentThreadId={currentThreadIdRef.current}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onSignOut={handleSignOut}
          authError={authError}
        />
      )}
    </div>
  );
}
