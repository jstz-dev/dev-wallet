import { Jstz } from "@jstz-dev/jstz-client";

import { sign } from "~/lib/jstz";
import type { WalletType } from "~/lib/vault";

export enum RequestEventTypes {
  CHECK_STATUS = "JSTZ_CHECK_EXTENSION_AVAILABILITY_REQUEST_TO_EXTENSION",
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

export enum ResponseEventTypes {
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
  CHECK_STATUS_RESPONSE = "JSTZ_CHECK_EXTENSION_AVAILABILITY_RESPONSE_FROM_EXTENSION",
  PROCESS_QUEUE = "PROCESS_QUEUE",
  DECLINE = "DECLINE",
}

interface RequestEvent {
  type: RequestEventTypes;
}

export interface SignEvent extends RequestEvent {
  type: RequestEventTypes.SIGN;
  data: {
    content: Jstz.Operation.DeployFunction | Jstz.Operation.RunFunction;
  };
}

export interface CheckStatusCall extends RequestEvent {
  type: RequestEventTypes.CHECK_STATUS;
}

export interface GetAddressEvent extends RequestEvent {
  type: RequestEventTypes.GET_ADDRESS;
}

interface ErrorResponse {
  type: ResponseEventTypes;
  error: string;
}

interface SignResponse {
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

interface GetAddressResponse {
  data: {
    accountAddress: string;
  };
}

interface QueuedSignRequest {
  type: RequestEventTypes.SIGN;
  resolve: (res: SignResponse | ErrorResponse) => void;
  content: SignEvent["data"]["content"];
}

interface QueuedGetAddressRequest {
  type: RequestEventTypes.GET_ADDRESS;
  resolve: (res: GetAddressResponse | ErrorResponse) => void;
}

let queuedRequest: QueuedSignRequest | QueuedGetAddressRequest | null = null;

interface ResponseEvent {
  type: ResponseEventTypes;
}
interface ProcessQueueEvent extends ResponseEvent {
  type: ResponseEventTypes.PROCESS_QUEUE;
  data: WalletType;
}

interface DeclineEvent extends ResponseEvent {
  type: ResponseEventTypes.DECLINE;
}

interface GetAddressResponseEvent extends ResponseEvent {
  type: ResponseEventTypes.GET_ADDRESS_RESPONSE;
  data: {
    accountAddress: string;
  };
}

export interface CheckStatusResponse extends ResponseEvent {
  type: ResponseEventTypes.CHECK_STATUS_RESPONSE;
  data: {
    success: true;
  };
}

function getResponseType(reqType: RequestEventTypes) {
  switch (reqType) {
    case RequestEventTypes.SIGN:
      return ResponseEventTypes.SIGN_RESPONSE;
    case RequestEventTypes.GET_ADDRESS:
      return ResponseEventTypes.GET_ADDRESS_RESPONSE;
    case RequestEventTypes.CHECK_STATUS:
      return ResponseEventTypes.CHECK_STATUS_RESPONSE;
    default:
      throw new Error("Unknown request type");
  }
}

chrome.runtime.onMessage.addListener(
  async (
    request:
      | SignEvent
      | GetAddressEvent
      | CheckStatusCall
      | ProcessQueueEvent
      | DeclineEvent
      | GetAddressResponseEvent,
    _sender,
    sendResponse,
  ) => {
    // content script to sw communication
    switch (request.type) {
      case RequestEventTypes.CHECK_STATUS: {
        sendResponse(
          JSON.stringify({
            type: ResponseEventTypes.CHECK_STATUS_RESPONSE,
            data: { success: true },
          }),
        );
        return false;
      }

      case RequestEventTypes.SIGN: {
        const { content } = request.data;

        await openWalletDialog({ flow: RequestEventTypes.SIGN });
        await afterOpenDialog()

        queuedRequest = {
          type: RequestEventTypes.SIGN,
          resolve: (data) => {
            sendResponse(JSON.stringify({ type: ResponseEventTypes.SIGN_RESPONSE, ...data }));
          },
          content,
        };
        return true;
      }

      case RequestEventTypes.GET_ADDRESS: {

        await openWalletDialog({ flow: RequestEventTypes.GET_ADDRESS });
        await afterOpenDialog()
        queuedRequest = {
          type: RequestEventTypes.GET_ADDRESS,
          resolve: (data) => {
            sendResponse(
              JSON.stringify({ type: ResponseEventTypes.GET_ADDRESS_RESPONSE, ...data }),
            );
          },
        };
        return true;
      }
    }

    if (!queuedRequest) {
      sendResponse({ error: "No request to sign" });
      return;
    }

    // dialog to sw communication
    switch (request.type) {
      case ResponseEventTypes.PROCESS_QUEUE: {
        const { address, publicKey, privateKey } = request.data;

        const { content, resolve } = queuedRequest as QueuedSignRequest;
        void createOperation({
          content,
          address: address,
        }).then((operation) => {
          const signature = sign(operation, privateKey);

          resolve({
            data: {
              operation,
              signature,
              publicKey,
              accountAddress: address,
            },
          });
        });

        break;
      }

      case ResponseEventTypes.DECLINE: {
        queuedRequest.resolve({
          type: getResponseType(queuedRequest.type),
          error: "Request rejected by the user",
        });
        break;
      }

      case ResponseEventTypes.GET_ADDRESS_RESPONSE: {
        const { accountAddress } = request.data;

        const { resolve } = queuedRequest as QueuedGetAddressRequest;

        resolve({
          data: {
            accountAddress,
          },
        });
        break;
      }
    }

    sendResponse({ message: "done" });

    return true; // Keep the message channel open for sendResponse
  },
);

async function createOperation({
  content,
  address,
}: {
  content: QueuedSignRequest["content"];
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

// FIXME: temporary solution. We need to find a reason for multiple popups to appear
async function afterOpenDialog() {
  const windows = await chrome.windows.getAll();

  const windowsToRemove = windows.filter((window, i) => window.type === "popup" && i !== windows.length - 1);

  for (const window of windowsToRemove) {
    if (window.type === "popup") {
      try {
        await chrome.windows.remove(Number(window.id));
      } catch (e) {
        console.warn(e)
      }
    }
  }
}

async function openWalletDialog(
  searchParams: Record<string, string> = {},
) {
  const params = new URLSearchParams({ isPopup: "true", ...searchParams });

  await chrome.windows.create(
    {
      url: `index.html?${params}`,
      type: "popup",
      focused: true,
      width: 450,
      height: 500,
      // incognito, top, left, ...
    }
  );
}
