import { useChat } from "@ai-sdk/react";
import type { Message, User } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { GoogleSignIn } from "./components/GoogleSignIn";
import { ThreadDetail } from "./components/ThreadDetail";
import { ThreadList } from "./components/ThreadList";
import { useAuth } from "./hooks/useAuth";
import { useThreads } from "./hooks/useThreads";
import { useThreadHistory } from "./hooks/useThreadHistory";

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
  
  const currentThreadIdRef = useRef<string | null>(null);
  const { threads, createThread } = useThreads();
  const { messages: historicalMessages, isLoading: isLoadingHistory } = useThreadHistory(currentThreadIdRef.current);

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

  // Switch to a different thread
  const switchToThread = async (threadId: string) => {
    currentThreadIdRef.current = threadId;
    window.history.pushState(null, "", `/threads/${threadId}`);
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
  };

  const handleSignOut = () => {
    signOut();
    currentThreadIdRef.current = null; // Reset thread on sign out
    // Reset URL to home
    window.history.pushState(null, "", "/");
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleNewThread = () => {
    currentThreadIdRef.current = null;
    window.history.pushState(null, "", "/");
  };

  // Load thread from URL on mount
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
