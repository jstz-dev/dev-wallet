import { createQueryKeys } from "@lukemorales/query-key-factory";
import { z } from "zod/mini";
import { $fetch } from "~/lib/$fetch";
import { Account } from "~/lib/validators/account";

export const accounts = createQueryKeys("accounts", {
  balance: (address: Account["address"]) => ({
    queryKey: ["balance", address],
    queryFn: async () => {
      const { data, error } = await $fetch(`/accounts/${address}/balance`, {
        output: z.object({ balance: z.nullish(z.number()) }),
      });

      if (error) {
        console.error(error);
        return null;
      }

      return data;
    },
  }),
});
