import { useRef } from "react";
import { Wallet } from "~/lib/Wallet";

/**
 * Values on the wallet object are not **reactive**.
 *
 * TODO: Create a store out of this.
 */
export function useWallet() {
  const wallet = useRef(Wallet.instance);
  return wallet.current;
}
