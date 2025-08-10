import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "../../src/components/MessageList";

export default function Home() {
  const [input, setInput] = useState("");

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
        threadId: null, // New thread
      }),
    }),
  });

  // Custom sendMessage that handles thread creation
  const sendMessage = async (message: { text: string }) => {
    try {
      // Send the message using the original function
      originalSendMessage(message);
      
      // After sending, we'll need to handle the thread creation response
      // This might require some additional logic to redirect to the new thread
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessageList
        historicalMessages={[]}
        currentMessages={messages}
        isLoadingHistory={false}
        currentThreadId={null}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
      />
    </div>
  );
}