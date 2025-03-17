import { StorageKeys } from "../lib/constants/storage";
import { sign } from "../lib/jstz";

enum WalletEvents {
  SIGN = "SIGN",
}

interface TGenericData {
  type: WalletEvents;
  data?: unknown;
}

interface TSignEventData extends TGenericData {
  type: WalletEvents.SIGN;
  data: {
    accountAddress: string;
    operation: unknown;
  };
}

chrome.runtime.onMessageExternal.addListener(
  async (request: TSignEventData, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEvents.SIGN: {
        const { operation } = request.data ?? {};

        const { [StorageKeys.PUBLIC_KEY]: publicKey, [StorageKeys.PRIVATE_KEY]: privateKey } =
          await chrome.storage.local.get([StorageKeys.PUBLIC_KEY, StorageKeys.PRIVATE_KEY]);

        if (!publicKey || !privateKey) {
          chrome.windows.create({
            url: "index.html",
            type: "popup",
            focused: true,
            width: 400,
            height: 400,
            // incognito, top, left, ...
          });
          sendResponse({ error: "No proper public/private keypair found" });
          return;
        }

        const signature = sign(operation, privateKey);
        sendResponse({ signature, publicKey: publicKey });
        break;
      }
    }
  },
);
