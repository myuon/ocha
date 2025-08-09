import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.join(process.cwd(), ".env") });
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));
app.get("/api/hello", (c) => c.json({ message: "Hello from Hono API" }));

// AI chat endpoint (streams responses)
app.post("/api/ai/chat", async (c) => {
  const apiKey = process.env.OPENAI_API_KEY;
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

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Serve frontend build (production)
// assets under dist/public (copied during build)
app.use("/assets/*", serveStatic({ root: "./dist/public" }));
// SPA fallback for any non-API route
app.get("*", serveStatic({ path: "./dist/public/index.html" }));

const port = Number(process.env.PORT || 3000);
console.log(`API listening on http://localhost:${port}`);

const server = serve({ fetch: app.fetch, port });
