import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const { messages, sendMessage } = useChat({
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
    }),
  });
  const [input, setInput] = useState("");

  const handleSignIn = (userData: User) => {
    setUser(userData);
    setAuthError(null);
    console.log("User signed in:", userData);
  };

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setAuthError(null);
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
    console.error("Auth error:", error);
  };

  // Check for existing token on mount
  useEffect(() => {
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
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>Ocha</h1>
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
      <hr style={{ margin: "24px 0" }} />

      <h2>AI Chat</h2>
      {!user ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
          }}
        >
          <p style={{ color: "#666", fontSize: "1.1em", marginBottom: 16 }}>
            Please sign in with Google to start chatting with the AI
          </p>
        </div>
      ) : (
        <div>
          <div
            style={{
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              backgroundColor: "#f9f9f9",
            }}
          >
            {messages?.length === 0 && (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                Start a conversation with the AI...
              </p>
            )}
            {messages?.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor:
                      message.role === "user" ? "#e3f2fd" : "#f3e5f5",
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
                    {message.parts?.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <Markdown
                            key={`${message.id}-text-${index}`}
                            id={message.id}
                            content={part.text}
                          />
                        );
                      }

                      // Handle tool parts
                      if (part.type.startsWith("tool-")) {
                        return (
                          <ToolDisplay
                            key={`${message.id}-tool-${index}`}
                            part={part as ToolPart}
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
      )}
    </div>
  );
}
