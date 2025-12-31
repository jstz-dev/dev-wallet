import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "~/env";

import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: env.DB_URL,
  },
  schema,
});
