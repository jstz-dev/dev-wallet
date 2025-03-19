import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type UseStorageLocalOptions<T, D> = Omit<
  UseQueryOptions<T, Error, D>,
  "queryKey" | "queryFn" | "initialData"
>;

export const storageKeys = {
  local: (keys: string | string[]) => ["local", keys],
};

export function useStorageLocal<T, D = T>(
  keys: string | string[],
  options: UseStorageLocalOptions<T, D> = {},
) {
  return useQuery({
    queryKey: ["local", keys],
    queryFn: async () => {
      const data = await chrome.storage.local.get(keys);

      if (Array.isArray(keys)) {
        return data as T;
      }

      return data[keys] as T;
    },
    ...options,
  });
}
