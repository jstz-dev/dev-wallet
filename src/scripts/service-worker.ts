import { type Accounts, StorageKeys } from "~/lib/constants/storage";
import { sign } from "~/lib/jstz";

export enum WalletEvents {
  SIGN = "SIGN",
  PROCESS_QUEUE = "PROCESS_QUEUE",
}

interface TEvent {
  type: WalletEvents;
  data?: unknown;
}

interface SignEvent extends TEvent {
  type: WalletEvents.SIGN;
  data?: {
    accountAddress: string;
    operation: Record<string, unknown>;
  };
}

function openWalletDialog() {
  const params = new URLSearchParams([["isPopup", "true"]]);
  void chrome.windows.create({
    url: `index.html?${params}`,
    type: "popup",
    focused: true,
    width: 400,
    height: 400,
    // incognito, top, left, ...
  });
}

interface ProcessQueueEvent extends TEvent {
  type: WalletEvents.PROCESS_QUEUE;
  data: Accounts[string];
}

interface SignRequest {
  resolve: (res?: unknown) => void;
  operation: unknown;
}

const signQueue: SignRequest[] = [];

chrome.runtime.onMessageExternal.addListener(async (request: SignEvent, _sender, sendResponse) => {
  switch (request.type) {
    // Once we'll add more message types this will no longer be an issue.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case WalletEvents.SIGN: {
      const { operation, accountAddress } = request.data ?? {};

      if (!operation) {
        sendResponse({ error: 'Missing property, "operation" must be provided.' });
        return;
      }

      const { accounts = {}, currentAddress } = await chrome.storage.local.get<{
        accounts: Accounts;
        currentAddress: string;
      }>([StorageKeys.ACCOUNTS, StorageKeys.CURRENT_ADDRESS]);

      if (Object.keys(accounts).length === 0) {
        openWalletDialog();

        signQueue.push({ resolve: sendResponse, operation });
        return;
      }

      if (!currentAddress || !accounts[currentAddress]) {
        openWalletDialog();
        sendResponse({ error: "No account found" });
        return;
      }

      const { [StorageKeys.PUBLIC_KEY]: publicKey, [StorageKeys.PRIVATE_KEY]: privateKey } =
        accounts[currentAddress] ?? {
          publicKey: "",
          privateKey: "",
        };

      if (!publicKey || !privateKey) {
        sendResponse({ error: "No proper public/private keypair found" });
        return;
      }

      const signature = sign(operation, privateKey);
      sendResponse({ signature, publicKey: publicKey, accountAddress });
      break;
    }
  }
});

chrome.runtime.onMessage.addListener((request: ProcessQueueEvent, _sender, sendResponse) => {
  switch (request.type) {
    // Once we'll add more message types this will no longer be an issue.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case WalletEvents.PROCESS_QUEUE: {
      while (signQueue.length > 0) {
        const queueRequest = signQueue.shift();
        if (!queueRequest) break;

        const account = request.data;

        const signature = sign(
          queueRequest.operation as Record<string, unknown>,
          account.privateKey,
        );

        queueRequest.resolve({
          signature,
          publicKey: account.publicKey,
        });
      }

      sendResponse({ message: "done" });
      break;
    }
  }
});
