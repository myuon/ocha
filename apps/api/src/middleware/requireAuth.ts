import { OAuth2Client } from "google-auth-library";
import type { Context, Next } from "hono";
import { config } from "../config/index.js";
import type { AuthContext, User } from "../types/auth.js";

const client = new OAuth2Client(config.google.clientId);

export const requireAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ error: "Invalid token payload" }, 401);
    }

    if (!payload.email || !payload.name) {
      return c.json({ error: "Missing required user information" }, 401);
    }

    const user: User = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified_email: payload.email_verified || false,
    };

    // Add user to context
    c.set("auth", { user } as AuthContext);

    await next();
  } catch (error) {
    console.error("Auth verification error:", error);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
