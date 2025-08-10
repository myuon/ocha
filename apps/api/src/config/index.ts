import path from "node:path";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Parse available users from comma-separated email list
const parseAvailableUsers = (users?: string): string[] | null => {
  if (!users || users.trim() === "") {
    return null; // No restriction if not set
  }
  return users
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

export const config = {
  port: Number(process.env.PORT || 3000),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  auth: {
    availableUsers: parseAvailableUsers(process.env.AVAILABLE_USERS),
  },
  static: {
    root: "./dist/public",
    indexPath: "./dist/public/index.html",
  },
} as const;
