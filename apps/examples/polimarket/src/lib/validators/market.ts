import { z } from "zod/mini";
import { tokenSchema } from "./token";

export const marketFormSchema = z.object({
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  admins: z.array(z.string()),
  resolutionUrl: z.nullish(z.string()),
  tokens: z.array(tokenSchema),
  pool: z.number().check(z.gte(0)),
});

export type MarketForm = z.infer<typeof marketFormSchema>;

export const marketSchema = z.object({
  state: z.enum(["created", "on-going", "resolved"]),
  admins: z.array(z.string()),
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  tokens: z.array(tokenSchema),
  users: z.object(),
  bets: z.array(tokenSchema),
});

export type Market = z.infer<typeof marketSchema>;
