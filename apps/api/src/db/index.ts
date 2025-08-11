import { readFile } from "fs/promises";
import { dirname, join } from "path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import type { Message, Thread } from "@ocha/types";

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = "conversations.db") {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // Read and execute schema
          const schemaPath = join(__dirname, "schema.sql");
          const schema = await readFile(schemaPath, "utf-8");

          // Execute schema statements
          const statements = schema.split(";").filter((s) => s.trim());
          for (const statement of statements) {
            await this.run(statement);
          }

          // Migration: Add parts column if it doesn't exist
          try {
            await this.run("ALTER TABLE messages ADD COLUMN parts TEXT");
            console.log("Added parts column to messages table");
          } catch (migrationError: any) {
            // Column already exists or other error - that's okay
            if (!migrationError.message?.includes("duplicate column name")) {
              console.warn("Migration warning:", migrationError.message);
            }
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async get<T>(
    sql: string,
    params: any[] = []
  ): Promise<T | undefined> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  private async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async createThread(id: string, title?: string): Promise<Thread> {
    const sql = `
      INSERT INTO threads (id, title) 
      VALUES (?, ?) 
      RETURNING *
    `;

    const thread = await this.get<Thread>(sql, [id, title]);
    if (!thread) throw new Error("Failed to create thread");

    return thread;
  }

  async getThread(id: string): Promise<Thread | undefined> {
    const sql = "SELECT * FROM threads WHERE id = ?";
    return await this.get<Thread>(sql, [id]);
  }

  async getAllThreads(): Promise<Thread[]> {
    const sql = "SELECT * FROM threads ORDER BY updated_at DESC";
    return await this.all<Thread>(sql);
  }

  async addMessage(
    id: string,
    threadId: string,
    role: "user" | "assistant" | "system",
    content?: string,
    parts?: any[]
  ): Promise<Message> {
    // Update thread's updated_at timestamp
    await this.run(
      "UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [threadId]
    );

    const sql = `
      INSERT INTO messages (id, thread_id, role, content, parts) 
      VALUES (?, ?, ?, ?, ?) 
      RETURNING *
    `;

    const partsJson = parts ? JSON.stringify(parts) : null;
    const message = await this.get<Message>(sql, [
      id,
      threadId,
      role,
      content,
      partsJson,
    ]);
    if (!message) throw new Error("Failed to add message");

    return message;
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    const sql =
      "SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC";
    return await this.all<Message>(sql, [threadId]);
  }

  async deleteThread(id: string): Promise<void> {
    await this.run("DELETE FROM threads WHERE id = ?", [id]);
  }

  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = new Database();
    await dbInstance.initialize();
  }
  return dbInstance;
}

export { Database };
