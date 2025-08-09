import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error.js";
import { chatHandler } from "./routes/chat.js";
import { healthHandler } from "./routes/health.js";
import { setupGracefulShutdown } from "./utils/server.js";

const app = new Hono();

// Global error handling
app.use("*", errorHandler);

// Health check
app.get("/health", healthHandler);

// API routes
app.post("/api/ai/chat", chatHandler);

// Serve frontend build (production)
// assets under dist/public (copied during build)
app.use("/assets/*", serveStatic({ root: config.static.root }));
// SPA fallback for any non-API route
app.get("*", serveStatic({ path: config.static.indexPath }));

console.log(`API listening on http://localhost:${config.port}`);

const server = serve({ fetch: app.fetch, port: config.port });

setupGracefulShutdown(server);
