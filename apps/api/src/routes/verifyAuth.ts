import type { Context } from "hono";
import type { AuthContext } from "../types/auth.js";

export const verifyAuthHandler = async (c: Context) => {
  // At this point, the requireAuth middleware has already verified the token
  // and set the user in the context
  const auth = c.get("auth") as AuthContext;

  return c.json({
    success: true,
    user: auth.user,
  });
};
