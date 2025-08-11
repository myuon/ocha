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

      // Save user message to database if threadId is provided
      if (threadId && messages.length > 0) {
        try {
          const { getDatabase } = await import("../db/index.js");
          const db = await getDatabase();

          // Get the last message (should be the user's message)
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.role === "user") {
            const messageId = nanoid();
            // Save both content and parts for full message preservation
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
          console.error("Failed to save user message:", error);
          // Don't fail the request if saving fails
        }
      }

      // Convert UI messages to model messages
      const modelMessages = convertToModelMessages(messages);

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
