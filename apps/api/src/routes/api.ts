import type { Context } from "hono";

export const helloHandler = (c: Context) => {
  return c.json({ message: "Hello from Hono API" });
};
