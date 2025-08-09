import { Context } from "hono";
import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "../config/index.js";

export const chatHandler = async (c: Context) => {
  const { apiKey } = config.openai;
  if (!apiKey) {
    return c.json({ error: "OPENAI_API_KEY is not set" }, 500);
  }

  try {
    const body = await c.req.json();
    console.log("Received body:", JSON.stringify(body, null, 2));

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Invalid messages format" }, 400);
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
            city: "San Francisco",
            region: "California",
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
