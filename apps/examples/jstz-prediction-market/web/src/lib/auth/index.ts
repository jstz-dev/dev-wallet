import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { db } from "../db";
import { accountsTable, sessionsTable, usersTable, verificationsTable } from "../db/schema";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_AUTH_URL,
  secret: env.AUTH_SECRET,
  plugins: [nextCookies()],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      verification: verificationsTable,
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
    },
  }),

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_AUTH_SECRET,
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/callback") && ctx.params.id === "google") {
        const user = ctx.context.newSession?.user;

        if (user) {
          const isDomainAllowed = env.ALLOWED_DOMAINS.some((domain) => user.email.endsWith(domain));
          const isEmailAllowed = env.ALLOWED_EMAILS.some(
            (allowedEmail) => user.email === allowedEmail,
          );

          const isAllowed = isEmailAllowed || isDomainAllowed;
          if (!isAllowed) {
            await db.delete(usersTable).where(eq(usersTable.id, user.id));

            throw new APIError("BAD_REQUEST", {
              message: "Provided Google domain is not within the white list",
            });
          }
        }
      }
    }),
  },
});
