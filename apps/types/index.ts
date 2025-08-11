// User types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

// Thread types
export interface Thread {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

// Message types
export interface Message {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  parts: string | any; // JSON string in DB, parsed object in frontend
  created_at: string;
}

// Tool types (AI SDK related)
export interface ToolPart {
  type: string;
  toolCallId: string;
  state: "call" | "output-available" | "partial" | "error";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  providerExecuted?: boolean;
}

// Auth types
export interface AuthContext {
  user: User | null;
}