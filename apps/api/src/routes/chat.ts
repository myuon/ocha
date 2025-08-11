import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { ChatRequestSchema } from "../types/chat.js";
import type { AuthContext } from "../types/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

type Variables = {
  auth: AuthContext;
};

// Utility function to extract content from parts
function extractContentFromParts(parts: any[]): string {
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
      const { threadId, content } = c.req.valid("json");
      console.log(
        "Received body:",
        JSON.stringify({ threadId, content }, null, 2)
      );

      const { getDatabase } = await import("../db/index.js");
      const db = await getDatabase();

      // Get recent messages from the thread (last 20)  
      const allThreadMessages = await db.getThreadMessages(threadId);
      const recentMessages = allThreadMessages.slice(-20);
      console.log(`Loaded ${recentMessages.length} recent messages for thread ${threadId}`);

      // Convert historical messages to the format expected by AI SDK
      const historyInAiFormat = recentMessages.map((msg: any) => {
        const parts = typeof msg.parts === "string" ? JSON.parse(msg.parts) : msg.parts;
        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: extractContentFromParts(parts),
          parts: parts,
        };
      });

      // Create parts for the new user message
      const userMessageParts = [{ type: "text", text: content }];

      // Add the new user message
      const newUserMessage = {
        id: nanoid(),
        role: "user" as const,
        content: content,
        parts: userMessageParts,
      };

      // Combine historical messages with new user message
      const allMessages = [...historyInAiFormat, newUserMessage];

      // Save the new user message to database
      const messageId = nanoid();
      await db.addMessage(
        messageId,
        threadId,
        "user",
        userMessageParts
      );
      console.log(`Saved user message to thread ${threadId}`);

      // Convert UI messages to model messages
      const modelMessages = convertToModelMessages(allMessages as any);

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
