import path from "node:path";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  port: Number(process.env.PORT || 3000),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  static: {
    root: "./dist/public",
    indexPath: "./dist/public/index.html",
  },
} as const;
