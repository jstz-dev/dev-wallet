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
    operation: Record<string, unknown>;
  };
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
  async (request: TSignEventData, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEvents.SIGN: {
        const { operation } = request.data ?? {};

        const { accounts, currentAddress } = await chrome.storage.local.get([
          StorageKeys.ACCOUNTS,
          StorageKeys.CURRENT_ADDRESS,
        ]);

        if (!accounts || !currentAddress || !accounts[currentAddress]) {
          openWalletDialog();
          sendResponse({ error: "No account found" });
          return;
        }

        const { [StorageKeys.PUBLIC_KEY]: publicKey, [StorageKeys.PRIVATE_KEY]: privateKey } =
          accounts[currentAddress];

        if (!publicKey || !privateKey) {
          openWalletDialog();
          sendResponse({ error: "No proper public/private keypair found" });
          return;
        }

        const signature = sign(operation, privateKey);
        sendResponse({ signature, publicKey: publicKey, accountAddress: currentAddress });
        break;
      }
    }
  },
);
