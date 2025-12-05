import { createFetch, type CreateFetchOption } from "@better-fetch/fetch";

import SuperJSON from "superjson";
import { env } from "~/env";

function createCustomFetch(options: CreateFetchOption = { throw: false }) {
  return createFetch({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL,
    credentials: "include",
    ...options,
  });
}

const $fetch = createFetch({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  jsonParser: (text): unknown => {
    if (text.startsWith('{"json"')) {
      return SuperJSON.parse(text);
    }

    return JSON.parse(text);
  },
  throw: false,
  credentials: "include",
});

export { $fetch, createCustomFetch };
