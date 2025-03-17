import { StorageKeys } from "../lib/constants/storage";
import { sign } from "../lib/jstz";

enum WalletEvents {
  SIGN = "SIGN",
  QUEUE = "QUEUE",
  PROCESS_QUEUE = "PROCESS_QUEUE",
}

interface TRequest {
  type: WalletEvents;
  data?: unknown;
}

interface TSignRequest extends TRequest {
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

interface TGenericRequest extends TRequest {
  type: WalletEvents;
}

const queue: Array<{ resolve: (res: any) => void; data: unknown }> = [];

chrome.runtime.onMessageExternal.addListener(
  async (request: TGenericRequest | TSignRequest, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEvents.QUEUE: {
        queue.push({ resolve: sendResponse, data: request.data });
        break;
      }

      case WalletEvents.PROCESS_QUEUE: {
        while (queue.length > 0) {
          const request = queue.shift();
          if (request) request.resolve(request.data);
        }

        sendResponse({ message: "done" });
        break;
      }

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
