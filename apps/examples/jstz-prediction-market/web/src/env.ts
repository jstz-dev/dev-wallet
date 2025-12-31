import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/mini";

const authURL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      "https://" + process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL!
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
      ? "https://" + process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
      : process.env.NEXT_PUBLIC_AUTH_URL;

export const env = createEnv({
  extends: [vercel()],

  server: {
    ALLOWED_DOMAINS: z.pipe(
      z.string(),
      z.transform((val) => val.split(",")),
    ),
    ALLOWED_EMAILS: z.pipe(
      z.string(),
      z.transform((val) => val.split(",")),
    ),

    AUTH_SECRET: z.string(),

    GOOGLE_AUTH_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),

    DATABASE_URL: z.string(),

    WALLET_ADDRESS: z.string(),
    WALLET_PUBLIC_KEY: z.string(),
    WALLET_SECRET_KEY: z.string(),
  },

  client: {
    NEXT_PUBLIC_AUTH_URL: z.url(),
    NEXT_PUBLIC_PARENT_SF_ADDRESS: z.string().check(z.length(36)),
    NEXT_PUBLIC_API_BASE_URL: z.string(),
    NEXT_PUBLIC_JSTZ_NODE_ENDPOINT: z.string(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_AUTH_URL: authURL,
    NEXT_PUBLIC_PARENT_SF_ADDRESS: process.env.NEXT_PUBLIC_PARENT_SF_ADDRESS,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_JSTZ_NODE_ENDPOINT: process.env.NEXT_PUBLIC_JSTZ_NODE_ENDPOINT,
  },
});
