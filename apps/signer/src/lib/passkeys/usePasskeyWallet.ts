import { useRef } from "react";
import { PasskeyWallet } from "./PasskeyWallet";

import { RP_ID } from "./constants";
import { userStore } from "./userStore";

export function usePasskeyWallet() {
  const wallet = useRef(
    new PasskeyWallet(userStore, RP_ID, [`chrome-extension://${chrome.runtime.id}`], 60_000),
  );

  return wallet;
}
