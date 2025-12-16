import Jstz from "@jstz-dev/jstz-client";
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { createJstzClient } from "~/lib/jstz-signer.service";

export const smartFunctions = createQueryKeys("smart-functions", {
  getKv: (address: string, query: string, jstzClient: Jstz = createJstzClient()) => ({
    queryKey: ["kv", address, query],
    queryFn: async ({ signal }) => {
      return jstzClient.accounts.getKv(address, { key: query }, { signal });
    },
  }),
});
