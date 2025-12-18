import { z } from "zod/mini";

const ONE_TEZ = 1_000_000;

export const tokenSchema = z.object({
  token: z.enum(["yes", "no"]),
  amount: z.number().check(z.gte(1)),
  price: z.number().check(z.gte(1), z.lte(ONE_TEZ)),
});

export type Token = z.infer<typeof tokenSchema>;
