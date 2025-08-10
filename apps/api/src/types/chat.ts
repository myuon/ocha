import { z } from "zod";

export const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().optional(),
      parts: z.array(
        z.object({
          type: z.literal("text"),
          text: z.string(),
        })
      ),
    })
  ),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
