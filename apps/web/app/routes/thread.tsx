import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";

interface Message {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: any;
  created_at: string;
}

export default function Thread() {
  const { threadId } = useParams();
  const [input, setInput] = useState("");
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load thread history on component mount
  useEffect(() => {
    if (!threadId) return;

    const loadThreadHistory = async () => {
      setIsLoadingHistory(true);
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setIsLoadingHistory(false);
        return;
      }

      try {
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
        console.error("Error loading thread:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadThreadHistory();
  }, [threadId]);

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
        threadId: threadId,
      }),
    }),
  });

  const sendMessage = async (message: { text: string }) => {
    try {
      originalSendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessageList
        historicalMessages={historicalMessages}
        currentMessages={messages}
        isLoadingHistory={isLoadingHistory}
        currentThreadId={threadId || null}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
      />
    </div>
  );
}