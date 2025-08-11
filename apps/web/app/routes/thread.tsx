import { useChat } from "@ai-sdk/react";
import type { Message } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData, useParams, useSearchParams } from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";
import { useAuth } from "../../src/hooks/useAuth";

interface ThreadData {
  messages: Message[];
}

export async function loader({
  params,
}: LoaderFunctionArgs): Promise<ThreadData> {
  const { threadId } = params;

  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === "undefined") {
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const { getAuthHeaders } = useAuth();

  // Get initial message from URL params (from home navigation)
  const initialMessage = searchParams.get("message");

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: getAuthHeaders,
      body: () => ({
        threadId,
      }),
    }),
  });
  console.log(messages);

  // Send initial message if provided from home
  useEffect(() => {
    if (initialMessage && threadId) {
      // Send initial message using fetch directly
      const sendInitialMessage = async () => {
        try {
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              threadId,
              content: initialMessage,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to send initial message");
          }
        } catch (error) {
          console.error("Error sending initial message:", error);
        }
      };

      sendInitialMessage();
      // Remove the message parameter from URL
      setSearchParams({});
    }
  }, [initialMessage, threadId, getAuthHeaders, setSearchParams]);

  if (!threadId) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Thread not found
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessageList
        historicalMessages={threadData.messages}
        currentMessages={messages as Message[]}
        isLoadingHistory={false}
        currentThreadId={threadId}
        input={input}
        onInputChange={setInput}
        onSendMessage={({ text }) => {
          sendMessage(
            {
              role: "user",
              parts: [{ type: "text", text: text }],
            },
            {
              body: {
                threadId,
              },
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
            }
          );
        }}
      />
    </div>
  );
}
