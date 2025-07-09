export function shortenAddress(address: string | undefined, length = 4): string {
  if (!address) return "-";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

