import { useRef } from "react";
import { PasskeyWallet } from "./PasskeyWallet";

import { userStore } from "./userStore";

export function usePasskeyWallet() {
  const wallet = useRef(
    new PasskeyWallet(userStore, "localhost", [`chrome-extension://${chrome.runtime.id}`], 60_000),
  );

  return wallet;
}
