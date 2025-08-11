import { useChat } from "@ai-sdk/react";
import type { Message } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData, useParams } from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";

interface ThreadData {
  messages: Message[];
}

export async function loader({ params }: LoaderFunctionArgs): Promise<ThreadData> {
  const { threadId } = params;
  
  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === 'undefined') {
    return { messages: [] };
  }

  const token = localStorage.getItem("auth_token");
  
  if (!token || !threadId) {
    return { messages: [] };
  }

  try {
    const response = await fetch(`/api/threads/${threadId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { messages: data.messages };
    }
  } catch (error) {
    console.error("Error loading thread:", error);
  }

  return { messages: [] };
}

export default function Thread() {
  const { messages: historicalMessages } = useLoaderData<ThreadData>();
  const { threadId } = useParams();
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
        isLoadingHistory={false}
        currentThreadId={threadId || null}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
      />
    </div>
  );
}