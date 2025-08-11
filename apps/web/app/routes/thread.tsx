import type { Message } from "@ocha/types";
import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData, useParams, useRevalidator } from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";
import { useAuth } from "../../src/hooks/useAuth";
import { client } from "../../src/lib/api";

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
    } else {
      console.error("Failed to fetch thread messages");
      return { messages: [] };
    }
  } catch (error) {
    console.error("Error loading thread messages:", error);
    return { messages: [] };
  }
}

export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const threadData = useLoaderData() as ThreadData;
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { getAuthHeaders } = useAuth();
  const { revalidate } = useRevalidator();

  // Custom message sending function
  const sendMessage = async (message: { text: string }) => {
    if (!threadId) return;
    
    setIsLoading(true);
    try {
      const response = await client.api.ai.chat.$post(
        {
          json: { threadId, content: message.text },
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Revalidate to refresh the messages
      revalidate();
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!threadId) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "18px",
        color: "#666"
      }}>
        Thread not found
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessageList
        historicalMessages={threadData.messages} // From loader
        currentMessages={[]} // No current messages since we reload from server
        isLoadingHistory={isLoading}
        currentThreadId={threadId}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
      />
    </div>
  );
}