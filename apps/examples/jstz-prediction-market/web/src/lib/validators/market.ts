import { z } from "zod/mini";
import { tokenSchema } from "./token";

export const marketFormSchema = z.object({
  question: z.string(),
  resolutionDate: z.date(),
  admins: z.array(z.string()),
  resolutionUrl: z.nullish(z.string()),
  tokens: z.array(tokenSchema),
  pool: z.number().check(z.gte(0)),
});

export type MarketForm = z.infer<typeof marketFormSchema>;

export const createMarketSchema = z.object({
  ...z.omit(marketFormSchema, { resolutionDate: true }).shape,
  resolutionDate: z.iso.datetime(),
});

export type CreateMarket = z.infer<typeof createMarketSchema>;

export const marketSchema = z.object({
  state: z.enum(["created", "on-going", "resolved"]),
  admins: z.array(z.string()),
  question: z.string(),
  resolutionDate: z.iso.datetime(),
  tokens: z.array(tokenSchema),
  bets: z.array(z.object({ ...tokenSchema.shape, isSynthetic: z.boolean() })),
});

export type Market = z.infer<typeof marketSchema>;
