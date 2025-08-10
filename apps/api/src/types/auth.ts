import { z } from "zod";

export const GoogleTokenSchema = z.object({
  credential: z.string(),
});

export type GoogleTokenRequest = z.infer<typeof GoogleTokenSchema>;

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface AuthContext {
  user: User | null;
}
