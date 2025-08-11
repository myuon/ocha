import { Hono } from "hono";
import type { AuthContext } from "../types/auth.js";

type Variables = {
  auth: AuthContext;
};

const verifyAuthRoutes = new Hono<{ Variables: Variables }>().post(
  "/verify",
  async (c) => {
    // At this point, the requireAuth middleware has already verified the token
    // and set the user in the context
    const auth = c.get("auth");

    return c.json({
      success: true,
      user: auth.user,
    });
  }
);

export default verifyAuthRoutes;
