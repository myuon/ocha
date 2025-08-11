import { createOpenAI } from "@ai-sdk/openai";
import { zValidator } from "@hono/zod-validator";
import { convertToModelMessages, streamText } from "ai";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AuthContext } from "../types/auth.js";
import { ChatRequestSchema } from "../types/chat.js";

type Variables = {
  auth: AuthContext;
};

interface MessagePart {
  type: string;
  text?: string;
  input?: { text?: string };
}

// Utility function to extract content from parts
function extractContentFromParts(parts: MessagePart[]): string {
  if (!Array.isArray(parts)) return "";

  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text || part.input?.text || "")
    .join("");
}

const app = new Hono<{ Variables: Variables }>();

app.use("*", requireAuth);

const chatRoutes = app.post(
  "/chat",
  zValidator("json", ChatRequestSchema),
  async (c) => {
    const { apiKey } = config.openai;
    if (!apiKey) {
      return c.json({ error: "OPENAI_API_KEY is not set" }, 500);
    }

    try {
      const requestBody = c.req.valid("json");
      console.log("Received body:", JSON.stringify(requestBody, null, 2));

      const { threadId, messages } = requestBody;

      interface ChatMessage {
        role: "user" | "assistant" | "system";
        parts: MessagePart[];
      }

      // Extract the latest user message from the messages array
      const userMessages = (messages as ChatMessage[]).filter(
        (msg) => msg.role === "user"
      );
      const latestUserMessage = userMessages[userMessages.length - 1];

      if (!latestUserMessage) {
        return c.json({ error: "No user message found" }, 400);
      }

      const { getDatabase } = await import("../db/index.js");
      const db = await getDatabase();

      // Get recent messages from the thread (last 20)
      const allThreadMessages = await db.getThreadMessages(threadId);
      const recentMessages = allThreadMessages.slice(-20);
      console.log(
        `Loaded ${recentMessages.length} recent messages for thread ${threadId}`
      );

      interface StoredMessage {
        id: string;
        role: string;
        parts: string | MessagePart[];
      }

      // Convert historical messages to the format expected by AI SDK
      const historyInAiFormat = (recentMessages as StoredMessage[]).map(
        (msg) => {
          const parts =
            typeof msg.parts === "string" ? JSON.parse(msg.parts) : msg.parts;
          return {
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            content: extractContentFromParts(parts),
            parts: parts,
          };
        }
      );

      // Extract content from the latest user message parts
      const userContent = extractContentFromParts(latestUserMessage.parts);

      // Generate new ID for the user message
      const userMessageId = nanoid();

      // Add the new user message
      const newUserMessage = {
        id: userMessageId,
        role: "user" as const,
        content: userContent,
        parts: latestUserMessage.parts,
      };

      // Combine historical messages with new user message
      const allMessages = [...historyInAiFormat, newUserMessage];

      // Save the new user message to database
      await db.addMessage(
        userMessageId,
        threadId,
        "user",
        latestUserMessage.parts
      );
      console.log(`Saved user message to thread ${threadId}`);

      // Convert UI messages to model messages
      const modelMessages = convertToModelMessages(allMessages);

      const openai = createOpenAI({ apiKey });

      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: modelMessages,
        tools: {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: "medium",
            userLocation: {
              type: "approximate",
              city: "Tokyo",
              country: "JP",
            },
          }),
        },
        async onFinish({ text }) {
          // Save conversation to database if threadId is provided
          if (threadId) {
            try {
              const { getDatabase } = await import("../db/index.js");
              const db = await getDatabase();

              // Generate unique message ID
              const messageId = nanoid();

              // Create parts array for assistant message
              const parts = [];
              if (text) {
                parts.push({ type: "text", text });
              }

              // Note: Tool calls and results are handled automatically by the AI SDK
              // and will be included in the streaming response to the client.
              // For now, we'll just save the text content. Tool information
              // can be added later when we have access to the full response structure.

              // Save the assistant's response with parts
              await db.addMessage(
                messageId,
                threadId,
                "assistant",
                parts.length > 0 ? parts : [{ type: "text", text: text || "" }]
              );

              console.log(`Saved assistant message to thread ${threadId}`);
            } catch (error) {
              console.error("Failed to save conversation:", error);
              // Don't fail the request if saving fails
            }
          }
        },
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error("Chat API error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

export default chatRoutes;
