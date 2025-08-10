import { z } from "zod";

export const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
