import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const threads = sqliteTable(
  "threads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    title: text("title"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_threads_user_id").on(table.userId)]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull(),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    parts: text("parts").notNull(), // JSON string
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_messages_thread_id").on(table.threadId),
    index("idx_messages_created_at").on(table.createdAt),
  ]
);

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
