import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { GoogleSignIn } from "./components/GoogleSignIn";
import { Markdown } from "./components/Markdown";
import { ToolDisplay } from "./components/ToolDisplay";

interface ToolPart {
  type: string;
  toolCallId: string;
  state: "call" | "output-available" | "partial" | "error";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  providerExecuted?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

interface Thread {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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

  // Helper function to render messages (both current and historical)
  const renderMessage = (message: any) => (
    <div
      key={message.id}
      style={{
        display: "flex",
        justifyContent: message.role === "user" ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: 12,
          borderRadius: 8,
          backgroundColor: message.role === "user" ? "#e3f2fd" : "#f3e5f5",
        }}
      >
        <strong
          style={{
            color: message.role === "user" ? "#1976d2" : "#7b1fa2",
          }}
        >
          {message.role === "user" ? "You:" : "AI:"}
        </strong>
        <div style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap" }}>
          {message.parts ? (
            message.parts.map((part: any, index: number) => {
              if (part.type === "text") {
                return (
                  <Markdown
                    key={`${message.id}-text-${index}`}
                    id={message.id}
                    content={part.text}
                  />
                );
              }
              if (part.type.startsWith("tool-")) {
                return (
                  <ToolDisplay
                    key={`${message.id}-tool-${index}`}
                    part={part as ToolPart}
                  />
                );
              }
              return null;
            })
          ) : (
            // For historical messages, content is just a string
            <div>{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", height: "100vh", display: "flex" }}>
      {/* Sidebar */}
      {user && (
        <div
          style={{
            width: 300,
            backgroundColor: "#f5f5f5",
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar Header */}
          <div style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Threads</h3>
            <button
              onClick={() => {
                currentThreadIdRef.current = null;
                setHistoricalMessages([]);
                window.history.pushState(null, "", "/");
              }}
              style={{
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 4,
                border: "1px solid #ddd",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: 14,
                width: "100%",
              }}
            >
              + New Thread
            </button>
          </div>

          {/* Thread List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => switchToThread(thread.id)}
                style={{
                  padding: 12,
                  borderBottom: "1px solid #e0e0e0",
                  cursor: "pointer",
                  backgroundColor:
                    currentThreadIdRef.current === thread.id ? "#e3f2fd" : "transparent",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentThreadIdRef.current !== thread.id) {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentThreadIdRef.current !== thread.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div style={{ fontSize: 14, fontWeight: "medium" }}>
                  {thread.title || `Thread ${thread.id.slice(0, 8)}...`}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {new Date(thread.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "#666" }}>
                No threads yet. Start a conversation!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
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
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {user.picture && (
                <img
                  src={user.picture}
                  alt="Profile"
                  style={{ width: 32, height: 32, borderRadius: "50%" }}
                />
              )}
              <span>Welcome, {user.name}!</span>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <GoogleSignIn onSignIn={handleSignIn} onError={handleAuthError} />
              {authError && (
                <p style={{ color: "red", marginTop: 8, fontSize: "0.9em" }}>
                  {authError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Chat Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!user ? (
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
          ) : (
            <>
              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 16,
                  backgroundColor: "#fafafa",
                }}
              >
                {isLoadingHistory && (
                  <div style={{ textAlign: "center", padding: 16, color: "#666" }}>
                    Loading thread history...
                  </div>
                )}
                
                {/* Historical Messages */}
                {historicalMessages.map((message) => renderMessage(message))}
                
                {/* Current Session Messages */}
                {messages?.map((message) => renderMessage(message))}
                
                {(historicalMessages.length === 0 && messages?.length === 0 && !isLoadingHistory) && (
                  <div style={{ textAlign: "center", padding: 32, color: "#666" }}>
                    <p style={{ fontSize: "1.1em", marginBottom: 8 }}>
                      {currentThreadIdRef.current ? "Continue the conversation" : "Start a new conversation"}
                    </p>
                    <p style={{ fontSize: "0.9em" }}>
                      Type a message below to get started...
                    </p>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div style={{ padding: 16, borderTop: "1px solid #ddd", backgroundColor: "white" }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim()) {
                      sendMessage({ text: input });
                      setInput("");
                    }
                  }}
                  style={{ display: "flex", gap: 8 }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      fontSize: 16,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    style={{
                      padding: "12px 24px",
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: !input.trim() ? "#ccc" : "#1976d2",
                      color: "white",
                      fontSize: 16,
                      cursor: !input.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
