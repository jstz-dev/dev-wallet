const ONE_TEZ = 1_000_000; // 1 tez = 1 million mutez
export const TEZ_SYMBOL = "ꜩ";

export function toTez(mutez: number): number {
  return +(mutez / ONE_TEZ).toFixed(2);
}

export function toMutez(tez: number): number {
  return tez * ONE_TEZ;
}

export function toTezString(mutez?: number | null): string {
  if (typeof mutez !== "number" || isNaN(mutez)) return "n/a";

  return `${toTez(mutez)} ${TEZ_SYMBOL}`;
}
