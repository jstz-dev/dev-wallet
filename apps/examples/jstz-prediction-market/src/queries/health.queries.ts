import { createQueryKeys } from "@lukemorales/query-key-factory";
import { $fetch } from "~/lib/$fetch";

export const health = createQueryKeys("health", {
  ping: {
    queryKey: ["ping"],
    queryFn: async () => {
      const { data, error } = await $fetch<{ message: string }>("/health");

      if (error) {
        console.error(error);
        return null;
      }

      return data;
    },
  },
});
