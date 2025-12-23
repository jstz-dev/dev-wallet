import { z } from "zod/mini";
import { betSchema, tokenSchema } from "./token";

const baseMarketSchema = z.object({
  question: z.string().check(z.minLength(3)),
  admins: z.array(z.string()),
  tokens: z.array(tokenSchema),
});

export const marketFormSchema = z.object({
  ...baseMarketSchema.shape,
  resolutionDate: z.date(),
  resolutionUrl: z.nullish(z.string()),
  pool: z.number().check(z.gte(0)),
});

export type MarketForm = z.infer<typeof marketFormSchema>;

export const createMarketSchema = z.object({
  ...baseMarketSchema.shape,
  resolutionDate: z.iso.datetime(),
});

export type CreateMarket = z.infer<typeof createMarketSchema>;

export const marketSchema = z.discriminatedUnion("state", [
  // State: created, on-going, or waiting-for-resolution
  z.object({
    ...baseMarketSchema.shape,
    state: z.enum(["created", "on-going", "waiting-for-resolution"]),
    resolutionDate: z.iso.datetime(),
    bets: z.array(betSchema),
  }),

  // State: resolved or closed
  z.object({
    ...baseMarketSchema.shape,
    state: z.enum(["resolved", "closed"]),
    bets: z.array(betSchema),
    resolutionDate: z.iso.datetime(),
    resolvedToken: tokenSchema,
  }),
]);

export type Market = z.infer<typeof marketSchema>;
