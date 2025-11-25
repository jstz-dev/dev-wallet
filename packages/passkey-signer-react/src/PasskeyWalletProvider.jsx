import { PasskeyWallet } from "passkeys";
import { createContext, useContext, useMemo, useRef } from "react";

/** @import {PropsWithChildren, Context} from "react"; */
/** @import {UserStore} from "passkeys"; */

/** @type {Context<{ wallet: PasskeyWallet }>} */
const PasskeyContext = createContext(/** @type {{ wallet: PasskeyWallet }} */ ({}));

/** @param {PropsWithChildren<{ userStore: UserStore; RP_ID: string; extensionId: string }>} props */
export function PasskeyProvider({ userStore, RP_ID, extensionId, children }) {
  const wallet = useRef(
    new PasskeyWallet(userStore, RP_ID, [`chrome-extension://${extensionId}`], 60_000),
  );

  const value = useMemo(
    () => ({
      wallet: wallet.current,
    }),
    [],
  );

  return <PasskeyContext value={value}>{children}</PasskeyContext>;
}

export function usePasskeyWallet() {
  return useContext(PasskeyContext);
}
