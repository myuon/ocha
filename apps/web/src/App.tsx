import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function App() {
  const [message, setMessage] = useState<string>("Loading...");
  const [userLocation, setUserLocation] = useState<any>(null);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
    }),
    body: {
      userLocation,
    },
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((d) => setMessage(d.message))
      .catch(() => setMessage("Could not reach API"));
  }, []);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Convert coordinates to approximate location format
          setUserLocation({
            type: "approximate",
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Fallback location is handled on the server side
        },
        {
          timeout: 5000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
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
          {messages?.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              Start a conversation with the AI...
            </p>
          )}
          {messages?.map((message) => (
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
              <div style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap" }}>
                {message.parts?.map((part, index) => {
                  if (part.type === "text") {
                    return <span key={index}>{part.text}</span>;
                  }
                  return null;
                })}
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
    </div>
  );
}
