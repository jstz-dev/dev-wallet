import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],

  server: {
    WALLET_ADDRESS: z.string(),
    WALLET_PUBLIC_KEY: z.string(),
    WALLET_SECRET_KEY: z.string(),
  },

  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string(),
    NEXT_PUBLIC_JSTZ_NODE_ENDPOINT: z.string(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_JSTZ_NODE_ENDPOINT: process.env.NEXT_PUBLIC_JSTZ_NODE_ENDPOINT,
  },
});
