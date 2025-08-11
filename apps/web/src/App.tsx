import { useChat } from "@ai-sdk/react";
import type { Message, Thread, User } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { GoogleSignIn } from "./components/GoogleSignIn";
import { ThreadDetail } from "./components/ThreadDetail";
import { ThreadList } from "./components/ThreadList";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const {
    user,
    authError,
    isLoading: authLoading,
    signIn,
    signOut,
    setAuthError,
    getAuthHeaders,
  } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [_threadTitles, _setThreadTitles] = useState<Record<string, string>>(
    {}
  );
  const currentThreadIdRef = useRef<string | null>(null);

  const { messages, sendMessage: originalSendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: getAuthHeaders,
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
      const response = await fetch("/api/threads", {
        headers: getAuthHeaders(),
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
      const response = await fetch(`/api/threads/${threadId}`, {
        headers: getAuthHeaders(),
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
    const response = await fetch("/api/threads", {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
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
    signIn(userData);
    // Fetch threads after sign in
    await fetchThreads();
  };

  const handleSignOut = () => {
    signOut();
    currentThreadIdRef.current = null; // Reset thread on sign out
    setThreads([]); // Clear threads
    setHistoricalMessages([]); // Clear historical messages
    // Reset URL to home
    window.history.pushState(null, "", "/");
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleNewThread = () => {
    currentThreadIdRef.current = null;
    setHistoricalMessages([]);
    window.history.pushState(null, "", "/");
  };

  // Load thread from URL and handle auth state changes
  useEffect(() => {
    // Check for threadId in URL
    const path = window.location.pathname;
    const threadMatch = path.match(/^\/threads\/(.+)$/);
    if (threadMatch) {
      const threadId = threadMatch[1];
      currentThreadIdRef.current = threadId;
      console.log("Loaded thread from URL:", threadId);
    }
  }, []);

  // Handle user authentication state changes
  useEffect(() => {
    if (user && !authLoading) {
      // Fetch threads when user is authenticated
      fetchThreads().then(() => {
        // If there's a threadId in URL, load its history
        if (currentThreadIdRef.current) {
          loadThreadHistory(currentThreadIdRef.current);
        }
      });
    }
  }, [user, authLoading]);

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
          currentMessages={messages as Message[]}
          isLoadingHistory={isLoadingHistory}
          currentThreadId={currentThreadIdRef.current}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
