import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDatabase } from "../db/index.js";

const threads = new Hono();

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

// GET /threads - Get all threads
threads.get("/", async (c) => {
  try {
    const db = await getDatabase();
    const threadList = await db.getAllThreads();
    return c.json({ threads: threadList });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return c.json({ error: "Failed to fetch threads" }, 500);
  }
});

// POST /threads - Create new thread
threads.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { title } = createThreadSchema.parse(body);

    const db = await getDatabase();
    const threadId = generateId();
    const thread = await db.createThread(threadId, title);

    return c.json({ thread }, 201);
  } catch (error) {
    console.error("Error creating thread:", error);
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Invalid request body", details: error.issues },
        400
      );
    }
    return c.json({ error: "Failed to create thread" }, 500);
  }
});

// GET /threads/:threadId - Get specific thread with messages
threads.get("/:threadId", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const db = await getDatabase();

    const thread = await db.getThread(threadId);
    if (!thread) {
      return c.json({ error: "Thread not found" }, 404);
    }

    const messages = await db.getThreadMessages(threadId);

    return c.json({ thread, messages });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return c.json({ error: "Failed to fetch thread" }, 500);
  }
});

// POST /threads/:threadId/messages - Add message to thread
threads.post("/:threadId/messages", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const body = await c.req.json();
    const { role, content } = addMessageSchema.parse(body);

    const db = await getDatabase();

    // Check if thread exists
    const thread = await db.getThread(threadId);
    if (!thread) {
      return c.json({ error: "Thread not found" }, 404);
    }

    const messageId = generateId();
    const message = await db.addMessage(messageId, threadId, role, content);

    return c.json({ message }, 201);
  } catch (error) {
    console.error("Error adding message:", error);
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Invalid request body", details: error.issues },
        400
      );
    }
    return c.json({ error: "Failed to add message" }, 500);
  }
});

// DELETE /threads/:threadId - Delete thread
threads.delete("/:threadId", async (c) => {
  try {
    const threadId = c.req.param("threadId");
    const db = await getDatabase();

    const thread = await db.getThread(threadId);
    if (!thread) {
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
