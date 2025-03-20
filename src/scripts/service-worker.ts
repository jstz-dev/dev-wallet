import Jstz from "@jstz-dev/jstz-client";

import { StorageKeys } from "~/lib/constants/storage";
import { sign } from "~/lib/jstz";
import type { WalletType } from "~/lib/vault";

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
  resolve: (res: SignResponse) => void;
  content: SignEvent["data"]["content"];
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
           // Once we'll add more message types this will no longer be an issue.
           // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
           case WalletEvents.SIGN: {
        const { content } = request.data;

        const { accounts = {}, currentAddress } = await chrome.storage.local.get([
          StorageKeys.ACCOUNTS,
          StorageKeys.CURRENT_ADDRESS,
        ]);

        if (Object.entries(accounts).length === 0 || !currentAddress || !accounts[currentAddress]) {
          openWalletDialog();

          signQueue.push({ resolve: sendResponse, content });
          return;
        }

        const operation = await createOperation({ content, address: currentAddress });

        const { [StorageKeys.PUBLIC_KEY]: publicKey, [StorageKeys.PRIVATE_KEY]: privateKey } =
          accounts[currentAddress];

        const signature = sign(operation, privateKey);

        sendResponse({
          operation,
          signature,
          publicKey,
          accountAddress: currentAddress,
        });
        break;
      }
    }
  },
);

interface ProcessQueueEvent extends TEvent {
  type: WalletEvents.PROCESS_QUEUE;
  data: WalletType;
}

chrome.runtime.onMessage.addListener((request: ProcessQueueEvent, _sender, sendResponse) => {
  switch (request.type) {
    // Once we'll add more message types this will no longer be an issue.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case WalletEvents.PROCESS_QUEUE: {
      while (signQueue.length > 0) {
        const queueRequest = signQueue.shift();
        if (!queueRequest) break;

        const { address, publicKey, privateKey } = request.data;

        const operation = await createOperation({
          content: queueRequest.content,
          address: address,
        });

        const signature = sign(operation, privateKey!);

        queueRequest.resolve({
          operation,
          signature,
          publicKey: publicKey,
          accountAddress: address,
        });
      }

      sendResponse({ message: "done" });
      break;
    }
  }
});

async function createOperation({
  content,
  address,
}: {
  content: SignRequest["content"];
  address: WalletType["address"];
}): Promise<Jstz.Operation> {
  const jstzClient = new Jstz.Jstz({
    timeout: 6000,
  });

  const nonce = await jstzClient.accounts.getNonce(address).catch((_) => Promise.resolve(0));

  return {
    content,
    nonce,
    source: address,
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
