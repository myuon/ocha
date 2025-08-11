import { useChat } from "@ai-sdk/react";
import type { Message } from "@ocha/types";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { MessageList } from "../../src/components/MessageList";
import { useAuth } from "../../src/hooks/useAuth";
import { client, getAuthHeaders } from "../../src/lib/api";

export async function loader({ params }: LoaderFunctionArgs) {
  const { threadId } = params;

  // Server-side rendering時はlocalStorageが使用できないため、クライアント専用
  if (typeof window === "undefined") {
    return undefined;
  }

  const token = localStorage.getItem("auth_token");

  if (!token || !threadId) {
    return undefined;
  }

  try {
    const response = await client.api.threads[":threadId"].$get(
      {
        param: { threadId },
      },
      {
        headers: getAuthHeaders(),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Failed to fetch thread messages");
      return undefined;
    }
  } catch (error) {
    console.error("Error loading thread messages:", error);
    return undefined;
  }
}

interface ThreadChatProps {
  threadId: string;
  threadData: Awaited<ReturnType<typeof loader>>;
  initialMessage?: string;
}

function ThreadChat({ threadId, threadData, initialMessage }: ThreadChatProps) {
  const [input, setInput] = useState("");
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      headers: getAuthHeaders,
      body: () => ({
        threadId,
      }),
    }),
  });

  // Send initial message if provided from home
  const initialMessageRef = useRef(initialMessage);
  useEffect(() => {
    if (initialMessageRef.current && threadId) {
      // Send initial message using fetch directly
      sendMessage(
        {
          role: "user",
          parts: [{ type: "text", text: initialMessageRef.current }],
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
      initialMessageRef.current = "";
      navigate("", { state: { initialMessage: "" } });
    }
  }, [threadId, getAuthHeaders, sendMessage, navigate]);

  return (
    <MessageList
      isOwner={threadData?.isOwner ?? false}
      historicalMessages={threadData?.messages ?? []}
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
  );
}

export default function Thread() {
  const { threadId } = useParams<{ threadId: string }>();
  const threadData = useLoaderData<typeof loader>();

  // Get initial message from URL params (from home navigation)
  const { state } = useLocation();

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
    <ThreadChat
      key={threadId}
      threadId={threadId}
      threadData={threadData}
      initialMessage={state?.initialMessage}
    />
  );
}
