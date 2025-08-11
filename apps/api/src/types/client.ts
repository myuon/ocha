// Export individual route apps for better RPC client type inference
export { default as authRoutes } from "../routes/auth.js";
export { default as chatRoutes } from "../routes/chat.js";
export { default as healthRoutes } from "../routes/health.js";
export { default as threadsRoutes } from "../routes/threads.js";
export { default as verifyAuthRoutes } from "../routes/verifyAuth.js";