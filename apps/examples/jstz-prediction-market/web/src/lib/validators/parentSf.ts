import { z } from "zod/mini";

export const parentKvSchema = z.object({
  markets: z.record(
    z.string(),
    z.object({
      address: z.string().check(z.length(36)),
    }),
  ),
});
