import { type AccountStorageType, StorageKeysEnum } from "../lib/constants/storage.ts";
import { sign } from "../lib/jstz.ts";

enum WalletEvents {
  GET_COUNTER = "GET_COUNTER",
  SET_COUNTER = "SET_COUNTER",
  SIGN = "SIGN",
}

type SignEventDataType = {
  type: WalletEvents.SIGN;
  data: {
    accountAddress: string;
    operation: unknown;
  };
};

interface GenericDataType {
  type: WalletEvents.GET_COUNTER | WalletEvents.SET_COUNTER;
  data?: unknown;
}

chrome.runtime.onMessageExternal.addListener(
  async (request: GenericDataType | SignEventDataType, _sender, sendResponse) => {
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
        const { accountAddress, operation } = request.data ?? {};

        if (!accountAddress) {
          sendResponse({ error: "Account address is required" });
          return;
        }

        const { address: storedAddress } =
          await chrome.storage.local.get<AccountStorageType>(accountAddress);

        if (!storedAddress) {
          sendResponse({ error: "Account not found" });
          return;
        }

        const {
          [StorageKeysEnum.ACCOUNT_PUBLIC_KEY]: publicKey,
          [StorageKeysEnum.ACCOUNT_PRIVATE_KEY]: privateKey,
        } = storedAddress;

        if (!publicKey || !privateKey) {
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
