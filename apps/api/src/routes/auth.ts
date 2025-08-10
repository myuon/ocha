import { OAuth2Client } from "google-auth-library";
import type { Context } from "hono";
import { config } from "../config/index.js";
import { GoogleTokenSchema, type User } from "../types/auth.js";

const client = new OAuth2Client(config.google.clientId);

export const googleAuthHandler = async (c: Context) => {
  try {
    const body = await c.req.json();

    // Validate request body with Zod
    const parseResult = GoogleTokenSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Auth validation error:", parseResult.error.issues);
      return c.json(
        {
          error: "Invalid request format",
          details: parseResult.error.issues,
        },
        400
      );
    }

    const { credential } = parseResult.data;

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
};
