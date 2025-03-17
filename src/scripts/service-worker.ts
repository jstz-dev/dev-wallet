import { StorageKeys } from "../lib/constants/storage";
import { sign } from "../lib/jstz";

enum WalletEvents {
  GET_COUNTER = "GET_COUNTER",
  SET_COUNTER = "SET_COUNTER",
  SIGN = "SIGN",
}

type TSignEventData = {
  type: WalletEvents.SIGN;
  data: {
    accountAddress: string;
    operation: unknown;
  };
};

interface TGenericData {
  type: WalletEvents.GET_COUNTER | WalletEvents.SET_COUNTER;
  data?: unknown;
}

chrome.runtime.onMessageExternal.addListener(
  async (request: TGenericData | TSignEventData, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEvents.GET_COUNTER: {
        const data = await chrome.storage.local.get("counter");

        if (!data?.counter) {
          chrome.storage.local.set({ counter: 0 });
          data.counter = 0;
        }

        sendResponse({ counter: data.counter });
        break;
      }

      case WalletEvents.SET_COUNTER: {
        await chrome.storage.local.set({ counter: request.data });
        sendResponse({ counter: request.data });
        break;
      }

      case WalletEvents.SIGN: {
        const { operation } = request.data ?? {};

        const {
          [StorageKeys.ACCOUNT_PUBLIC_KEY]: publicKey,
          [StorageKeys.ACCOUNT_PRIVATE_KEY]: privateKey,
        } = await chrome.storage.local.get([
          StorageKeys.ACCOUNT_PUBLIC_KEY,
          StorageKeys.ACCOUNT_PRIVATE_KEY,
        ]);

        if (!publicKey || !privateKey) {
          chrome.windows.create({
            url: "index.html",
            type: 'popup',
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
