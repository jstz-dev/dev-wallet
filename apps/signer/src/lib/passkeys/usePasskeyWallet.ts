import Wallet from "passkeys-wallet";
import { useRef } from "react";

import { userStore } from "./userStore";

export function usePasskeyWallet() {
  const wallet = useRef(new Wallet(userStore, "localhost", ["http://localhost:4321"], 60_000));

  return wallet.current;
}
