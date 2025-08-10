import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import type { Context } from "hono";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { ChatRequestSchema } from "../types/chat.js";

export const chatHandler = async (c: Context) => {
  const { apiKey } = config.openai;
  if (!apiKey) {
    return c.json({ error: "OPENAI_API_KEY is not set" }, 500);
  }

  try {
    const body = await c.req.json();
    console.log("Received body:", JSON.stringify(body, null, 2));

    // Validate request body with Zod
    const parseResult = ChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.issues);
      return c.json(
        {
          error: "Invalid request format",
          details: parseResult.error.issues,
        },
        400
      );
    }

    const { messages, threadId } = parseResult.data;

    // Save user message to database if threadId is provided
    if (threadId && messages.length > 0) {
      try {
        const { getDatabase } = await import("../db/index.js");
        const db = await getDatabase();
        
        // Get the last message (should be the user's message)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          const messageId = nanoid();
          await db.addMessage(messageId, threadId, 'user', lastMessage.content);
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
      async onFinish({ text, finishReason }) {
        // Save conversation to database if threadId is provided
        if (threadId && text) {
          try {
            const { getDatabase } = await import("../db/index.js");
            const db = await getDatabase();
            
            // Generate unique message ID
            const messageId = nanoid();
            
            // Save the assistant's response
            await db.addMessage(messageId, threadId, 'assistant', text);
            
            console.log(`Saved assistant message to thread ${threadId}`);
          } catch (error) {
            console.error("Failed to save conversation:", error);
            // Don't fail the request if saving fails
          }
        }
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
