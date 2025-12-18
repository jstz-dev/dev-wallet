import Jstz from "@jstz-dev/jstz-client";
import { createQueryKeys } from "@lukemorales/query-key-factory";
import { createJstzClient } from "~/lib/jstz-signer.service";
import type { Account } from "~/lib/validators/account";

export const accounts = createQueryKeys("accounts", {
  balance: (address: Account["address"], jstzClient: Jstz = createJstzClient()) => ({
    queryKey: ["balance", address],
    queryFn: async ({ signal }) => {
      return jstzClient.accounts.getBalance(address, { signal });
    },
  }),
});
