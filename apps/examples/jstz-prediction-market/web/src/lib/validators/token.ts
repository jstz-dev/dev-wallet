import { z } from "zod/mini";

export const tokenSchema = z.object({
  token: z.enum(["yes", "no"]),
  amount: z.number(),
  price: z.number(),
});

export type Token = z.infer<typeof tokenSchema>;
