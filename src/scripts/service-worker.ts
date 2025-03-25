import { Jstz } from "@jstz-dev/jstz-client";

import { sign } from "~/lib/jstz";
import type { WalletType } from "~/lib/vault";

export enum WalletEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  PROCESS_QUEUE = "PROCESS_QUEUE",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  DECLINE = "DECLINE",
}

interface WalletEvent {
  type: WalletEventTypes;
  data?: unknown;
}

export interface SignEvent extends WalletEvent {
  type: WalletEventTypes.SIGN;
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

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: string) => {
    const request = JSON.parse(message) as SignEvent;
    switch (request.type) {
      // Once we'll add more message types this will no longer be an issue.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      case WalletEventTypes.SIGN: {
        const { content } = request.data;

        openWalletDialog();
        signQueue.push({
          resolve: (data: SignResponse) => {
            port.postMessage(JSON.stringify({ type: WalletEventTypes.SIGN_RESPONSE, ...data }));
          },
          content,
        });
        break;
      }
    }
  });
});

interface ProcessQueueEvent extends WalletEvent {
  type: WalletEventTypes.PROCESS_QUEUE;
  data: WalletType;
}

interface DeclineEvent extends WalletEvent {
  type: WalletEventTypes.DECLINE;
}

chrome.runtime.onMessage.addListener(
  async (request: ProcessQueueEvent | DeclineEvent, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEventTypes.PROCESS_QUEUE: {
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

      case WalletEventTypes.DECLINE: {
        while (signQueue.length > 0) {
          const queueRequest = signQueue.shift();
          if (!queueRequest) break;

          queueRequest.resolve({ error: "Signing rejected by the user" });
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
    width: 450,
    height: 500,
    // incognito, top, left, ...
  });
}
