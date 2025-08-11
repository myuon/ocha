import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export default defineConfig({
  schema: resolve(__dirname, "apps/api/src/db/schema.ts"),
  out: resolve(__dirname, "apps/api/src/db/migrations"),
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.NODE_ENV === "production" 
      ? "file:/app/conversations.db"
      : "file:./conversations.db"
  }
});