import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error.js";
import { requireAuth } from "./middleware/requireAuth.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import healthRoutes from "./routes/health.js";
import threadsRoutes from "./routes/threads.js";
import verifyAuthRoutes from "./routes/verifyAuth.js";
import { setupGracefulShutdown } from "./utils/server.js";
import { cors } from "hono/cors";

const app = new Hono();

app
  // Global error handling
  .use("*", errorHandler)
  .use("*", cors())
  .use("/api/auth/*", requireAuth)
  .use("/api/ai/*", requireAuth)
  // Serve frontend build (production)
  // assets under dist/public (copied during build)
  .use("/assets/*", serveStatic({ root: config.static.root }))
  // SPA fallback for any non-API route
  .get("*", serveStatic({ path: config.static.indexPath }));

const route = app
  // Health check
  .route("/health", healthRoutes)

  // API routes
  .route("/api/auth", authRoutes)
  .route("/api/auth", verifyAuthRoutes)
  .route("/api/ai", chatRoutes)

  // Thread routes
  .route("/api/threads", threadsRoutes);

console.log(`API listening on http://localhost:${config.port}`);

const server = serve({ fetch: app.fetch, port: config.port });

setupGracefulShutdown(server);

// Export app type for RPC client
export type AppType = typeof route;

// Export individual route types for easier RPC client setup
export type AuthRoutesType = typeof authRoutes;
export type ChatRoutesType = typeof chatRoutes;
export type HealthRoutesType = typeof healthRoutes;
export type ThreadsRoutesType = typeof threadsRoutes;
export type VerifyAuthRoutesType = typeof verifyAuthRoutes;
