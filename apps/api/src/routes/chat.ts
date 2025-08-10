import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import type { Context } from "hono";
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

    const { messages } = parseResult.data;

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
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
