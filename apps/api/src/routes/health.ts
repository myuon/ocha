import type { Context } from "hono";

export const healthHandler = (c: Context) => {
  return c.json({ ok: true });
};
