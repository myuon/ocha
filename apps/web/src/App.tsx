import { useEffect, useState } from "react";
import { useChat } from "ai/react";

export default function App() {
  const [message, setMessage] = useState<string>("Loading...");
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/chat",
  });

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((d) => setMessage(d.message))
      .catch(() => setMessage("Could not reach API"));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Ocha</h1>
      <p>{message}</p>
      <p style={{ color: "#666" }}>React + Vite + TypeScript</p>
      <hr style={{ margin: "24px 0" }} />
      
      <h2>AI Chat</h2>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div 
          style={{ 
            height: 400, 
            overflowY: "scroll", 
            border: "1px solid #ddd", 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            backgroundColor: "#f9f9f9"
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              Start a conversation with the AI...
            </p>
          )}
          {messages.map((message: any) => (
            <div
              key={message.id}
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                backgroundColor: message.role === "user" ? "#e3f2fd" : "#f3e5f5",
              }}
            >
              <strong style={{ color: message.role === "user" ? "#1976d2" : "#7b1fa2" }}>
                {message.role === "user" ? "You:" : "AI:"}
              </strong>
              <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap" }}>
                {message.content}
              </p>
            </div>
          ))}
          {isLoading && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#f3e5f5",
              }}
            >
              <strong style={{ color: "#7b1fa2" }}>AI:</strong>
              <p style={{ margin: "8px 0 0 0", fontStyle: "italic", color: "#666" }}>
                Thinking...
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
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
            disabled={isLoading || !input.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: isLoading || !input.trim() ? "#ccc" : "#1976d2",
              color: "white",
              fontSize: 16,
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
