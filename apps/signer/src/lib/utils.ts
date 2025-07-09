import { defineConfig } from "cva";
import { twMerge } from "tailwind-merge";

export const {
  cva,
  cx: cn,
  compose,
} = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className),
  },
});

export function shortenAddress(address: string | undefined, length = 4): string {
  if (!address) return "-";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}