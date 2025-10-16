export function shortenAddress(address: string | undefined, length = 4): string {
  if (!address) return "-";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export async function asyncFind<T>(arr: T[], predicate: (val: T) => Promise<boolean>) {
  const promises = arr.map(predicate);
  const results = await Promise.all(promises);

  for (let i = 0; i < results.length; i++) {
    const bool = results[i];
    if (!bool) continue;

    return arr[i];
  }
}
