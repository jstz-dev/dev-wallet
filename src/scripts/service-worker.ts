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

function openWalletDialog() {
  void chrome.windows.create({
    url: "index.html",
    type: "popup",
    focused: true,
    width: 400,
    height: 400,
    // incognito, top, left, ...
  });
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

        const { accounts } = await chrome.storage.local.get("accounts");

        console.log(accounts, request.data.accountAddress, accounts?.[request.data.accountAddress]);

        if (!accounts || !accounts[request.data.accountAddress]) {
          openWalletDialog();
          sendResponse({ error: "No account found" });
          return;
        }

        const {
          [StorageKeys.ACCOUNT_PUBLIC_KEY]: publicKey,
          [StorageKeys.ACCOUNT_PRIVATE_KEY]: privateKey,
        } = accounts[request.data.accountAddress];

        if (!publicKey || !privateKey) {
          openWalletDialog();
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
