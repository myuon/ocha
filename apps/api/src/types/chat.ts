import { z } from "zod";

// Message part schema for Vercel AI SDK format
const MessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

// Message schema for Vercel AI SDK format
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(MessagePartSchema),
  id: z.string(),
});

// New Vercel AI SDK request format
export const ChatRequestSchema = z.object({
  threadId: z.string(),
  id: z.string().optional(), // Can be ignored
  messages: z.array(MessageSchema),
  trigger: z.string().optional(), // Can be ignored
});

// Legacy format for backward compatibility
export const LegacyChatRequestSchema = z.object({
  threadId: z.string(),
  content: z.string(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type LegacyChatRequest = z.infer<typeof LegacyChatRequestSchema>;
