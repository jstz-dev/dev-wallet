import { z } from "zod/mini";

export const accountSchema = z.object({
  address: z.string().check(z.length(36)),
  balance: z.uint32(),
  /** If it's set to `-1` that means it was added by us and not the indexer. */
  nonce: z.int32(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Account = z.infer<typeof accountSchema>;
