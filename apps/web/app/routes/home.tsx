import { useChat } from "@ai-sdk/react";
import type { Message } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";
import { useAuth } from "../../src/hooks/useAuth";
import { useThreads } from "../../src/hooks/useThreads";

export default function Home() {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { createThread } = useThreads(); // SWR for thread creation (auxiliary)

  const { messages, sendMessage: originalSendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: getAuthHeaders,
      body: () => ({
        threadId: null, // New thread
      }),
    }),
  });

  // Custom sendMessage that handles thread creation and navigation
  const sendMessage = async (message: { text: string }) => {
    try {
      // Create a new thread first using SWR (auxiliary usage)
      const threadId = await createThread();
      
      // Send message to the API with the new threadId
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message.text }],
          threadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      // Navigate to the new thread page after sending the message
      navigate(`/threads/${threadId}`);
    } catch (error) {
      console.error("Error creating thread or sending message:", error);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessageList
        historicalMessages={[]}
        currentMessages={messages as Message[]}
        isLoadingHistory={false}
        currentThreadId={null}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
      />
    </div>
  );
}