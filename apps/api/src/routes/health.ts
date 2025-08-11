import { Hono } from "hono";

const healthRoutes = new Hono();

healthRoutes.get("/", async (c) => {
  try {
    // Test database initialization
    const { getDatabase } = await import("../db/index.js");
    const db = await getDatabase();

    // Simple test query to verify Drizzle is working
    // For health check, we'll just test with an empty user ID
    const threads = await db.getAllThreads("test-user");

    return c.json({
      ok: true,
      database: "connected",
      threadsCount: threads.length,
      drizzle: "initialized",
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return c.json({
      ok: true,
      database: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default healthRoutes;
