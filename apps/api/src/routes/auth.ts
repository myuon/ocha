import { OAuth2Client } from "google-auth-library";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { config } from "../config/index.js";
import { GoogleTokenSchema, type User } from "../types/auth.js";

const client = new OAuth2Client(config.google.clientId);

const authRoutes = new Hono().post(
  "/google",
  zValidator("json", GoogleTokenSchema),
  async (c) => {
    try {
      const { credential } = c.req.valid("json");

      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return c.json({ error: "Invalid token payload" }, 401);
      }

      // Extract user information
      if (!payload.email || !payload.name) {
        return c.json({ error: "Missing required user information" }, 401);
      }

      // Check if user is in the allowed users list (if configured)
      if (config.auth.availableUsers) {
        if (!config.auth.availableUsers.includes(payload.email)) {
          console.log(`Access denied for user: ${payload.email}`);
          return c.json({ error: "Access denied: User not authorized" }, 403);
        }
      }

      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };

      // In a real app, you might want to:
      // 1. Store/update user in database
      // 2. Generate your own JWT token
      // 3. Set secure HTTP-only cookies

      return c.json({
        success: true,
        user,
        token: credential, // Return the Google JWT token for client storage
      });
    } catch (error) {
      console.error("Google auth error:", error);
      return c.json({ error: "Authentication failed" }, 401);
    }
  }
);

export default authRoutes;
