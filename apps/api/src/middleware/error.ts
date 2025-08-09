import { Context, Next } from "hono";

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error("Unhandled error:", error);
    return c.json(
      { error: "Internal server error" },
      500
    );
  }
};