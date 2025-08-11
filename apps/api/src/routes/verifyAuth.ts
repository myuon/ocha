import { Hono } from "hono";
import type { AuthContext } from "../types/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

type Variables = {
  auth: AuthContext;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", requireAuth);

const verifyAuthRoutes = app.post("/verify", async (c) => {
  // At this point, the requireAuth middleware has already verified the token
  // and set the user in the context
  const auth = c.get("auth");

  return c.json({
    success: true,
    user: auth.user,
  });
});

export default verifyAuthRoutes;
