import type { Message, Thread } from "@ocha/types";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { messages, threads } from "./schema.js";

export async function createDbConnection() {
  return drizzle(async (sql, params, method) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

    if (!accountId || !databaseId) {
      throw new Error(
        "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_D1_DATABASE_ID"
      );
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method }),
    });

    interface D1Response {
      success: boolean;
      errors: string[];
      result: Array<{
        success: boolean;
        results: Record<string, unknown>[];
      }>;
    }

    const data = (await res.json()) as D1Response;

    if (res.status !== 200)
      throw new Error(
        `Error from sqlite proxy server: ${res.status} ${res.statusText}\n${JSON.stringify(data)}`
      );
    if (data.errors.length > 0 || !data.success)
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}}`
      );

    const qResult = data.result[0];

    if (!qResult.success)
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}`
      );

    // https://orm.drizzle.team/docs/get-started-sqlite#http-proxy
    return { rows: qResult.results.map((r) => Object.values(r)) };
  });
}

class DrizzleDatabase {
  private db: ReturnType<typeof drizzle>;

  constructor(dbConnection: ReturnType<typeof drizzle>) {
    this.db = dbConnection;
  }

  async initialize(): Promise<void> {
    console.log("Database initialized with Drizzle ORM and Cloudflare D1");
  }

  async createThread(
    id: string,
    userId: string,
    title?: string
  ): Promise<Thread> {
    const [thread] = await this.db
      .insert(threads)
      .values({ id, userId, title })
      .returning();

    if (!thread) throw new Error("Failed to create thread");

    // Convert Drizzle result to match existing interface
    return {
      id: thread.id,
      user_id: thread.userId,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
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
      user_id: thread.userId,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
    };
  }

  async getAllThreads(userId: string): Promise<Thread[]> {
    const result = await this.db
      .select()
      .from(threads)
      .where(eq(threads.userId, userId))
      .orderBy(desc(threads.updatedAt), desc(threads.createdAt));

    return result.map((thread) => ({
      id: thread.id,
      user_id: thread.userId,
      title: thread.title || undefined,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
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
      created_at: message.createdAt,
    };
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);

    return result.map((message) => ({
      id: message.id,
      thread_id: message.threadId,
      role: message.role,
      parts: message.parts,
      created_at: message.createdAt,
    }));
  }

  async deleteThread(id: string): Promise<void> {
    await this.db.delete(threads).where(eq(threads.id, id));
  }

  async updateThreadTitle(id: string, title: string): Promise<void> {
    await this.db
      .update(threads)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(threads.id, id));
  }

  async close(): Promise<void> {
    // No need to close connection for D1
  }
}

let dbInstance: DrizzleDatabase | null = null;

export async function getDatabase(): Promise<DrizzleDatabase> {
  if (!dbInstance) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !databaseId || !apiToken) {
      throw new Error(
        "Missing Cloudflare D1 configuration. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN environment variables."
      );
    }

    const dbConnection = await createDbConnection();
    dbInstance = new DrizzleDatabase(dbConnection);
    await dbInstance.initialize();
  }
  return dbInstance;
}
