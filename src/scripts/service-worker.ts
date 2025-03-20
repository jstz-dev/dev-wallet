import { Jstz } from "@jstz-dev/jstz-client";

import { sign } from "~/lib/jstz";
import type { WalletType } from "~/lib/vault";

export enum WalletRequestTypes {
  SIGN = "SIGN",
  PROCESS_QUEUE = "PROCESS_QUEUE",
  DECLINE = "DECLINE",
}

interface TEvent {
  type: WalletRequestTypes;
  data?: unknown;
}

interface SignEvent extends TEvent {
  type: WalletRequestTypes.SIGN;
  data: {
    content: Jstz.Operation.DeployFunction | Jstz.Operation.RunFunction;
  };
}

interface SignRequest {
  resolve: (res: SignResponse) => void;
  content: SignEvent["data"]["content"];
}

type SignResponse =
  | {
      data: {
        operation: Jstz.Operation;
        signature: string;
        publicKey: string;
        accountAddress: string;
      };
    }
  | {
      error: string;
    };

const signQueue: SignRequest[] = [];

chrome.runtime.onMessageExternal.addListener(
  (request: SignEvent, _sender, sendResponse: (payload: SignResponse) => void) => {
    switch (request.type) {
      // Once we'll add more message types this will no longer be an issue.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      case WalletRequestTypes.SIGN: {
        const { content } = request.data;

        openWalletDialog();
        signQueue.push({ resolve: sendResponse, content });
        break;
      }
    }
  },
);

interface ProcessQueueEvent extends TEvent {
  type: WalletRequestTypes.PROCESS_QUEUE;
  data: WalletType;
}

interface DeclineEvent extends TEvent {
  type: WalletRequestTypes.DECLINE;
}

chrome.runtime.onMessage.addListener(
  async (request: ProcessQueueEvent | DeclineEvent, _sender, sendResponse) => {
    switch (request.type) {
      case WalletRequestTypes.PROCESS_QUEUE: {
        while (signQueue.length > 0) {
          const queueRequest = signQueue.shift();
          if (!queueRequest) break;

          const { address, publicKey, privateKey } = request.data;

          const operation = await createOperation({
            content: queueRequest.content,
            address: address,
          });

          const signature = sign(operation, privateKey);

          queueRequest.resolve({
            data: {
              operation,
              signature,
              publicKey,
              accountAddress: address,
            },
          });
        }

        sendResponse({ message: "done" });
        break;
      }

      case WalletRequestTypes.DECLINE: {
        while (signQueue.length > 0) {
          const queueRequest = signQueue.shift();
          if (!queueRequest) break;

          queueRequest.resolve({ error: "User declined signage." });
        }

        sendResponse({ message: "done" });
        break;
      }
    }
  },
);

async function createOperation({
  content,
  address,
}: {
  content: SignRequest["content"];
  address: WalletType["address"];
}): Promise<Jstz.Operation> {
  const jstzClient = new Jstz({
    timeout: 6000,
  });

  const nonce = await jstzClient.accounts.getNonce(address).catch(() => Promise.resolve(0));

  return {
    content,
    nonce,
    source: address,
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
