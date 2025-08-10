import { OAuth2Client } from "google-auth-library";
import type { Context, Next } from "hono";
import { config } from "../config/index.js";
import type { AuthContext, User } from "../types/auth.js";

const client = new OAuth2Client(config.google.clientId);

export const authMiddleware = async (c: Context, next: Next) => {
  // For now, we'll make authentication optional
  // In production, you might want to make it required
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (payload) {
        if (payload.email && payload.name) {
          const user: User = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            verified_email: payload.email_verified || false,
          };

          // Add user to context
          c.set("auth", { user } as AuthContext);
        } else {
          c.set("auth", { user: null } as AuthContext);
        }
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      // Continue without authentication for now
      c.set("auth", { user: null } as AuthContext);
    }
  } else {
    // No authentication provided
    c.set("auth", { user: null } as AuthContext);
  }

  await next();
};
