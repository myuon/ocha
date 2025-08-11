import type { Message, ToolPart } from "@ocha/types";
import type { UIMessagePart } from "ai";
import { useEffect, useRef } from "react";
import { Markdown } from "./Markdown";
import { ToolDisplay } from "./ToolDisplay";

interface MessageListProps {
  historicalMessages: Message[];
  currentMessages: Message[];
  isLoadingHistory: boolean;
  currentThreadId: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (message: { text: string }) => void;
}

export function MessageList({
  historicalMessages,
  currentMessages,
  isLoadingHistory,
  currentThreadId,
  input,
  onInputChange,
  onSendMessage,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  // Helper function to render messages (both current and historical)
  const renderMessage = (message: Message) => {
    let parts = message.parts;

    // If parts is a string (from database), parse it as JSON
    if (typeof parts === "string") {
      try {
        parts = JSON.parse(parts);
      } catch (error) {
        console.error("Failed to parse message parts:", error);
        parts = null;
      }
    }

    return (
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
          <div style={{ margin: "8px 0 0 0" }}>
            {parts && Array.isArray(parts) ? (
              parts.map(
                (
                  part: UIMessagePart<
                    Record<string, never>,
                    Record<string, never>
                  >,
                  index: number
                ) => {
                  if (part.type === "text") {
                    return (
                      <Markdown
                        key={`${message.id}-text-${index}`}
                        id={message.id}
                        content={part.text}
                      />
                    );
                  }
                  if (part.type?.startsWith("tool-")) {
                    return (
                      <ToolDisplay
                        key={`${message.id}-tool-${index}`}
                        part={part as ToolPart}
                      />
                    );
                  }
                  return null;
                }
              )
            ) : (
              // Fallback when parts is not available
              <div>No content available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Messages Area - Scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
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
        {currentMessages?.map((message) => renderMessage(message))}

        {historicalMessages.length === 0 &&
          currentMessages?.length === 0 &&
          !isLoadingHistory && (
            <div style={{ textAlign: "center", padding: 32, color: "#666" }}>
              <p style={{ fontSize: "1.1em", marginBottom: 8 }}>
                {currentThreadId
                  ? "Continue the conversation"
                  : "Start a new conversation"}
              </p>
              <p style={{ fontSize: "0.9em" }}>
                Type a message below to get started...
              </p>
            </div>
          )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Fixed at bottom */}
      <div
        style={{
          padding: 16,
          flexShrink: 0, // Prevent input from shrinking
          position: "sticky",
          bottom: 0,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              onSendMessage({ text: input });
              onInputChange("");
            }
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
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
    </div>
  );
}
