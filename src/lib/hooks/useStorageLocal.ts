import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type UseStorageLocalOptions<T> = Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "initialData">;

export function useStorageLocal<T>(
  keys: string | string[],
  options: UseStorageLocalOptions<T> = {},
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
