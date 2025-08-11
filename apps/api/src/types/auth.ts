import { z } from "zod";

export const GoogleTokenSchema = z.object({
  credential: z.string(),
});

export type GoogleTokenRequest = z.infer<typeof GoogleTokenSchema>;

import type { AuthContext, User } from "@ocha/types";

export type { User, AuthContext };
