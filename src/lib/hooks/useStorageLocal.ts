import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type UseStorageLocalOptions<T, D> = Omit<
  UseQueryOptions<T, Error, D>,
  "queryKey" | "queryFn" | "initialData"
>;

export function useStorageLocal<T, D = T>(
  keys: string | string[],
  options: UseStorageLocalOptions<T, D> = {},
) {
  return useQuery({
    queryKey: ["local", keys],
    queryFn: async () => {
      const data = await chrome.storage.local.get(keys);

      if (Array.isArray(keys)) {
        return data;
      }

      return data[keys];
    },
    ...options,
  });
}
