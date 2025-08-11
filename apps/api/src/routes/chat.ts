import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import type { ToolPart } from "@ocha/types";
import { config } from "../config/index.js";
import { ChatRequestSchema } from "../types/chat.js";
import type { AuthContext } from "../types/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

type Variables = {
  auth: AuthContext;
};

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
      const { messages, threadId } = c.req.valid("json");
      console.log(
        "Received body:",
        JSON.stringify({ messages, threadId }, null, 2)
      );

      let allMessages = messages;

      // If threadId is provided, get conversation history and merge with current messages
      if (threadId) {
        try {
          const { getDatabase } = await import("../db/index.js");
          const db = await getDatabase();

          // Get historical messages from the thread
          const historicalMessages = await db.getThreadMessages(threadId);
          
          // Convert historical messages to the format expected by AI SDK
          const historyInAiFormat = historicalMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
            parts: typeof msg.parts === "string" ? JSON.parse(msg.parts) : msg.parts,
          }));

          // Combine historical messages with new messages
          // Remove duplicates based on content to avoid sending the same message twice
          const newUserMessages = messages.filter((msg: any) => msg.role === "user");
          const lastHistoricalMessage = historyInAiFormat[historyInAiFormat.length - 1];
          
          // Only add new messages that aren't already in history
          const uniqueNewMessages = newUserMessages.filter((msg: any) => {
            return !lastHistoricalMessage || msg.content !== lastHistoricalMessage.content;
          });

          allMessages = [...historyInAiFormat, ...uniqueNewMessages];
          console.log(`Loaded ${historicalMessages.length} historical messages for thread ${threadId}`);

          // Save the new user message to database
          if (uniqueNewMessages.length > 0) {
            const lastMessage = uniqueNewMessages[uniqueNewMessages.length - 1];
            const messageId = nanoid();
            const content =
              lastMessage.content ||
              (lastMessage.parts
                ? lastMessage.parts
                    .filter((part: ToolPart) => part.type === "text")
                    .map((part: ToolPart) => part.input?.text || "")
                    .join("")
                : "");
            await db.addMessage(
              messageId,
              threadId,
              "user",
              content,
              lastMessage.parts
            );
            console.log(`Saved user message to thread ${threadId}`);
          }
        } catch (error) {
          console.error("Failed to load thread history or save message:", error);
          // Don't fail the request if history loading fails, continue with original messages
        }
      }

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
                text,
                parts.length > 0 ? parts : undefined
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
