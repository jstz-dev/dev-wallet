import { Jstz } from "@jstz-dev/jstz-client";

import { sign } from "~/lib/jstz";
import type { WalletType } from "~/lib/vault";

export enum WalletEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",

  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",

  PROCESS_QUEUE = "PROCESS_QUEUE",
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

export interface GetAddressEvent extends WalletEvent {
  type: WalletEventTypes.GET_ADDRESS;
}

interface SignRequest {
  type: WalletEventTypes.SIGN;
  resolve: (res: SignResponse) => void;
  content: SignEvent["data"]["content"];
}

interface GetAddressRequest {
  type: WalletEventTypes.GET_ADDRESS;
  resolve: (res: GetAddressResponse) => void;
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

type GetAddressResponse =
  | {
      data: {
        accountAddress: string;
      };
    }
  | {
      error: string;
    };

let queue: Array<SignRequest | GetAddressRequest> = [];

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: string) => {
    const request = JSON.parse(message) as SignEvent | GetAddressEvent;

    switch (request.type) {
      case WalletEventTypes.SIGN: {
        const { content } = request.data;

        openWalletDialog({ flow: WalletEventTypes.SIGN });
        queue.push({
          type: WalletEventTypes.SIGN,
          resolve: (data: SignResponse) => {
            port.postMessage(JSON.stringify({ type: WalletEventTypes.SIGN_RESPONSE, ...data }));
          },
          content,
        });
        break;
      }

      case WalletEventTypes.GET_ADDRESS: {
        openWalletDialog({ flow: WalletEventTypes.GET_ADDRESS });
        queue.push({
          type: WalletEventTypes.GET_ADDRESS,
          resolve: (data) => {
            port.postMessage(
              JSON.stringify({ type: WalletEventTypes.GET_ADDRESS_RESPONSE, ...data }),
            );
          },
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

interface GetAddressResponseEvent extends WalletEvent {
  type: WalletEventTypes.GET_ADDRESS_RESPONSE;
  data: {
    accountAddress: string;
  };
}

chrome.runtime.onMessage.addListener(
  (request: ProcessQueueEvent | DeclineEvent | GetAddressResponseEvent, _sender, sendResponse) => {
    switch (request.type) {
      case WalletEventTypes.PROCESS_QUEUE: {
        queue = queue.reduce((acc: GetAddressRequest[], queueRequest) => {
          if (queueRequest.type !== WalletEventTypes.SIGN) {
            acc.push(queueRequest);
            return acc;
          }

          const { address, publicKey, privateKey } = request.data;

          void createOperation({
            content: queueRequest.content,
            address: address,
          }).then((operation) => {
            const signature = sign(operation, privateKey);

            queueRequest.resolve({
              data: {
                operation,
                signature,
                publicKey,
                accountAddress: address,
              },
            });
          });

          return acc;
        }, []);

        sendResponse({ message: "done" });
        break;
      }

      case WalletEventTypes.DECLINE: {
        queue = queue.reduce((acc: GetAddressRequest[], queueRequest) => {
          if (queueRequest.type !== WalletEventTypes.SIGN) {
            acc.push(queueRequest);
            return acc;
          }

          queueRequest.resolve({ error: "Signing rejected by the user" });
          return acc;
        }, []);

        sendResponse({ message: "done" });
        break;
      }

      case WalletEventTypes.GET_ADDRESS_RESPONSE: {
        queue = queue.reduce((acc: SignRequest[], queueRequest) => {
          if (queueRequest.type !== WalletEventTypes.GET_ADDRESS) {
            acc.push(queueRequest);
            return acc;
          }

          const { accountAddress } = request.data;

          queueRequest.resolve({
            data: {
              accountAddress,
            },
          });

          return acc;
        }, []);

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

function openWalletDialog(searchParams: Record<string, string> = {}) {
  const params = new URLSearchParams({ isPopup: "true", ...searchParams });

  void chrome.windows.create({
    url: `index.html?${params}`,
    type: "popup",
    focused: true,
    width: 450,
    height: 500,
    // incognito, top, left, ...
  });
}
