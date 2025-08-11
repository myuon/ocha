import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export default defineConfig({
  schema: resolve(__dirname, "apps/api/src/db/schema.ts"),
  out: resolve(__dirname, "apps/api/src/db/migrations"),
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!
  }
});