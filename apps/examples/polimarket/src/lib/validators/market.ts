import { z } from "zod/mini";
import { tokenSchema } from "./token";

export const marketSchema = z.object({
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  admins: z.array(z.string()),
  resolutionUrl: z.nullish(z.string()),
  tokens: z.array(tokenSchema),
  pool: z.number().check(z.gte(0)),
});

export type Market = z.infer<typeof marketSchema>;
