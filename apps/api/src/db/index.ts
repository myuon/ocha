import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { threads, messages } from "./schema.js";
import { eq, desc } from "drizzle-orm";
import type { Thread, Message } from "@ocha/types";

class DrizzleDatabase {
  private db: ReturnType<typeof drizzle>;
  private sqlite: Database.Database;

  constructor(dbPath: string = "../../conversations.db") {
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite);
  }

  async initialize(): Promise<void> {
    // Enable foreign keys
    this.sqlite.pragma("foreign_keys = ON");
    console.log("Database initialized with Drizzle ORM");
  }

  async createThread(id: string, title?: string): Promise<Thread> {
    const [thread] = await this.db
      .insert(threads)
      .values({ id, title })
      .returning();
    
    if (!thread) throw new Error("Failed to create thread");
    
    // Convert Drizzle result to match existing interface
    return {
      id: thread.id,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt
    };
  }

  async getThread(id: string): Promise<Thread | undefined> {
    const [thread] = await this.db
      .select()
      .from(threads)
      .where(eq(threads.id, id))
      .limit(1);
    
    if (!thread) return undefined;
    
    return {
      id: thread.id,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt
    };
  }

  async getAllThreads(): Promise<Thread[]> {
    const result = await this.db
      .select()
      .from(threads)
      .orderBy(desc(threads.updatedAt));
    
    return result.map(thread => ({
      id: thread.id,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt
    }));
  }

  async addMessage(
    id: string,
    threadId: string,
    role: "user" | "assistant" | "system",
    parts: unknown[]
  ): Promise<Message> {
    // Update thread's updated_at timestamp
    await this.db
      .update(threads)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(threads.id, threadId));

    const partsJson = JSON.stringify(parts);
    const [message] = await this.db
      .insert(messages)
      .values({ id, threadId, role, parts: partsJson })
      .returning();

    if (!message) throw new Error("Failed to add message");
    
    return {
      id: message.id,
      thread_id: message.threadId,
      role: message.role,
      parts: message.parts,
      created_at: message.createdAt
    };
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
    
    return result.map(message => ({
      id: message.id,
      thread_id: message.threadId,
      role: message.role,
      parts: message.parts,
      created_at: message.createdAt
    }));
  }

  async deleteThread(id: string): Promise<void> {
    await this.db
      .delete(threads)
      .where(eq(threads.id, id));
  }

  async close(): Promise<void> {
    this.sqlite.close();
  }
}

let dbInstance: DrizzleDatabase | null = null;

export async function getDatabase(): Promise<DrizzleDatabase> {
  if (!dbInstance) {
    dbInstance = new DrizzleDatabase();
    await dbInstance.initialize();
  }
  return dbInstance;
}