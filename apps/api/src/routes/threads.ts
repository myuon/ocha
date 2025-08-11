import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDatabase } from "../db/index.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AuthContext } from "../types/auth.js";

type Variables = {
  auth: AuthContext;
};

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().optional(),
});

const addMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

// Generate unique IDs using nanoid
function generateId(): string {
  return nanoid();
}

const app = new Hono<{ Variables: Variables }>();

app.use("*", requireAuth);

const threads = app
  // GET /threads - Get all threads
  .get("/", async (c) => {
    try {
      const auth = c.get("auth");
      const db = await getDatabase();
      const threadList = await db.getAllThreads(auth.user.id);
      return c.json({ threads: threadList });
    } catch (error) {
      console.error("Error fetching threads:", error);
      return c.json({ error: "Failed to fetch threads" }, 500);
    }
  })

  // POST /threads - Create new thread
  .post("/", zValidator("json", createThreadSchema), async (c) => {
    try {
      const { title } = c.req.valid("json");
      const auth = c.get("auth");

      const db = await getDatabase();
      const threadId = generateId();
      const thread = await db.createThread(threadId, auth.user.id, title);

      return c.json({ thread }, 201);
    } catch (error) {
      console.error("Error creating thread:", error);
      return c.json({ error: "Failed to create thread" }, 500);
    }
  })

  // GET /threads/:threadId - Get specific thread with messages
  .get("/:threadId", async (c) => {
    try {
      const threadId = c.req.param("threadId");
      const auth = c.get("auth");
      const db = await getDatabase();

      const thread = await db.getThread(threadId);
      if (!thread) {
        return c.json({ error: "Thread not found" }, 404);
      }

      const messages = await db.getThreadMessages(threadId);

      return c.json({
        thread,
        messages,
        isOwner: thread.user_id === auth.user.id,
      });
    } catch (error) {
      console.error("Error fetching thread:", error);
      return c.json({ error: "Failed to fetch thread" }, 500);
    }
  })

  // POST /threads/:threadId/messages - Add message to thread
  .post(
    "/:threadId/messages",
    zValidator("json", addMessageSchema),
    async (c) => {
      try {
        const threadId = c.req.param("threadId");
        const { role, content } = c.req.valid("json");

        const db = await getDatabase();

        // Check if thread exists and belongs to user
        const auth = c.get("auth");
        const thread = await db.getThread(threadId);
        if (!thread || thread.user_id !== auth.user.id) {
          return c.json({ error: "Thread not found" }, 404);
        }

        const messageId = generateId();
        const parts = [{ type: "text", text: content }];
        const message = await db.addMessage(messageId, threadId, role, parts);

        return c.json({ message }, 201);
      } catch (error) {
        console.error("Error adding message:", error);
        return c.json({ error: "Failed to add message" }, 500);
      }
    }
  )

  // DELETE /threads/:threadId - Delete thread
  .delete("/:threadId", async (c) => {
    try {
      const threadId = c.req.param("threadId");
      const auth = c.get("auth");
      const db = await getDatabase();

      const thread = await db.getThread(threadId);
      if (!thread || thread.user_id !== auth.user.id) {
        return c.json({ error: "Thread not found" }, 404);
      }

      await db.deleteThread(threadId);

      return c.json({ message: "Thread deleted successfully" });
    } catch (error) {
      console.error("Error deleting thread:", error);
      return c.json({ error: "Failed to delete thread" }, 500);
    }
  });

export default threads;
