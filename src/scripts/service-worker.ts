import {type Accounts, StorageKeys} from "~/lib/constants/storage";
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
  data: {
    accountAddress: string;
    operation: Record<string, unknown>;
  };
}

function openWalletDialog() {
  const params = new URLSearchParams([["isPopup", "true"]]);
  void chrome.windows.create({
    url: `index.html${params ? `?${params}` : ""}`,
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
  resolve: (res?: any) => void;
  operation: unknown;
}

const signQueue: SignRequest[] = [];

chrome.runtime.onMessageExternal.addListener(async (request: SignEvent, _sender, sendResponse) => {
  switch (request.type) {
    case WalletEvents.SIGN: {
      const { operation, accountAddress } = request.data ?? {};

      const { accounts = {}, currentAddress } = await chrome.storage.local.get([
        StorageKeys.ACCOUNTS,
        StorageKeys.CURRENT_ADDRESS,
      ]);

      if (Object.entries(accounts).length === 0) {
        openWalletDialog();

        signQueue.push({ resolve: sendResponse, operation });
        return;
      }

      if (!accounts || !currentAddress || !accounts[currentAddress]) {
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

chrome.runtime.onMessage.addListener(async (request: ProcessQueueEvent, _sender, sendResponse) => {
  switch (request.type) {
    case WalletEvents.PROCESS_QUEUE: {
      while (signQueue.length > 0) {
        const queueRequest = signQueue.shift();
        if (!queueRequest) break;

        const account = request.data;

        const signature = sign(
          queueRequest.operation as Record<string, unknown>,
          account.privateKey!,
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
