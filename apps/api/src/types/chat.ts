import { z } from "zod";

export const ChatRequestSchema = z.object({
  threadId: z.string(),
  content: z.string(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
