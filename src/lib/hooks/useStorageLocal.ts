import { useQuery, type UseQueryOptions, } from "@tanstack/react-query";

type UseStorageLocalOptions<T> = Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "initialData">;

export function useStorageLocal<T>(
  key: string,
  initialValue?: T,
  options: UseStorageLocalOptions<T> = {},
) {
  return useQuery({
    queryKey: ["local", key],
    queryFn: async () => {
      const data = await chrome.storage.local.get(key);

      if (!data[key]) {
        data[key] = initialValue;
        void chrome.storage.local.set({ [key]: initialValue });
      }

      return data[key];
    },
    initialData: initialValue,
    ...options,
  });
}
