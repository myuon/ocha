import { hc } from "hono/client";
import type { AppType } from "@ocha/api";

// Create RPC client
export const client = hc<AppType>("http://localhost:3000");

// Helper function to get auth headers
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
