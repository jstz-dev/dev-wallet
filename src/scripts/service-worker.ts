import Jstz from "@jstz-dev/jstz-client";

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
  data: {
    content: Jstz.Operation.DeployFunction | Jstz.Operation.RunFunction;
  };
}

interface SignRequest {
  resolve: (res?: any) => void;
  operation: Jstz.Operation;
}

interface SignResponse {
  operation: Jstz.Operation;
  signature: string;
  publicKey: string;
  accountAddress: string;
}

const signQueue: SignRequest[] = [];

chrome.runtime.onMessageExternal.addListener(
  async (request: SignEvent, _sender, sendResponse: (payload: SignResponse) => void) => {
    switch (request.type) {
      case WalletEvents.SIGN: {
        const { content } = request.data ?? {};

        const { accounts = {}, currentAddress } = await chrome.storage.local.get([
          StorageKeys.ACCOUNTS,
          StorageKeys.CURRENT_ADDRESS,
        ]);

        const jstzClient = new Jstz.Jstz({
          timeout: 6000,
        });

        const nonce = await jstzClient.accounts
          .getNonce(currentAddress)
          .catch((_) => Promise.resolve(0));

        const operation: Jstz.Operation = {
          content,
          nonce,
          source: currentAddress,
        };

        if (Object.entries(accounts).length === 0 || !currentAddress || !accounts[currentAddress]) {
          openWalletDialog();

          signQueue.push({ resolve: sendResponse, operation });
          return;
        }

        const { [StorageKeys.PUBLIC_KEY]: publicKey, [StorageKeys.PRIVATE_KEY]: privateKey } =
          accounts[currentAddress];

        const signature = sign(operation, privateKey);
        sendResponse({
          operation,
          signature,
          publicKey: publicKey,
          accountAddress: currentAddress,
        });
        break;
      }
    }
  },
);

interface ProcessQueueEvent extends TEvent {
  type: WalletEvents.PROCESS_QUEUE;
  data: Accounts[string];
}

chrome.runtime.onMessage.addListener(async (request: ProcessQueueEvent, _sender, sendResponse) => {
  switch (request.type) {
    case WalletEvents.PROCESS_QUEUE: {
      while (signQueue.length > 0) {
        const queueRequest = signQueue.shift();
        if (!queueRequest) break;

        const account = request.data;

        const signature = sign(queueRequest.operation, account.privateKey!);

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
