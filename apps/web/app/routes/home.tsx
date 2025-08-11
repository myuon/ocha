import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThreads } from "../../src/hooks/useThreads";

export default function Home() {
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { createThread } = useThreads();

  const handleStartThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Create a new thread
      const threadId = await createThread();
      
      // Navigate to the new thread with the initial message
      navigate(`/threads/${threadId}?message=${encodeURIComponent(input.trim())}`);
    } catch (error) {
      console.error("Error creating thread:", error);
      setIsCreating(false);
    }
  };

  return (
    <div style={{ 
      flex: 1, 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center",
      padding: "2rem",
      gap: "2rem"
    }}>
      <div style={{ 
        textAlign: "center",
        maxWidth: "600px"
      }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          marginBottom: "1rem",
          color: "#333"
        }}>
          Start a New Conversation
        </h1>
        <p style={{ 
          fontSize: "1.2rem", 
          color: "#666",
          marginBottom: "2rem"
        }}>
          Ask me anything to begin a new thread
        </p>
      </div>

      <form onSubmit={handleStartThread} style={{ 
        width: "100%", 
        maxWidth: "600px",
        display: "flex",
        gap: "1rem"
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isCreating}
          style={{
            flex: 1,
            padding: "1rem",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <button
          type="submit"
          disabled={!input.trim() || isCreating}
          style={{
            padding: "1rem 2rem",
            fontSize: "1rem",
            backgroundColor: !input.trim() || isCreating ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: !input.trim() || isCreating ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            minWidth: "120px"
          }}
        >
          {isCreating ? "Creating..." : "Start Chat"}
        </button>
      </form>
    </div>
  );
}