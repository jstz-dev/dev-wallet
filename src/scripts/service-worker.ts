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

interface NetworkDependentEvent {
  networkUrl?: string;
}

interface RequestEvent {
  type: RequestEventTypes;
}

export interface SignEvent extends RequestEvent {
  type: RequestEventTypes.SIGN;
  data: NetworkDependentEvent & {
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

interface QueuedSignRequest extends NetworkDependentEvent {
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
  data: WalletType & NetworkDependentEvent;
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
  (
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
        const { content, networkUrl } = request.data;

        openWalletDialog({ flow: RequestEventTypes.SIGN }, (window?: chrome.windows.Window) =>
          closeDuplicateWindows(window?.id),
        );
        queuedRequest = {
          type: RequestEventTypes.SIGN,
          resolve: (data) => {
            sendResponse(JSON.stringify({ type: ResponseEventTypes.SIGN_RESPONSE, ...data }));
          },
          content,
          networkUrl,
        };
        return true;
      }

      case RequestEventTypes.GET_ADDRESS: {
        openWalletDialog(
          { flow: RequestEventTypes.GET_ADDRESS },
          (window?: chrome.windows.Window) => closeDuplicateWindows(window?.id),
        );

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
        const { address, publicKey, privateKey, networkUrl } = request.data;

        const { content, networkUrl: overrideNetworkUrl, resolve } = queuedRequest as QueuedSignRequest;
        void createOperation({
          content,
          address,
          publicKey,
          baseURL: overrideNetworkUrl ?? networkUrl
        })
          .then((operation) => {
            const signature = sign(operation, privateKey);

            console.log(`Signature: ${signature}`);

            resolve({
              data: {
                operation,
                signature,
                publicKey,
                accountAddress: address,
              },
            });
          })
          .catch((err: unknown) => {
            resolve({ type: ResponseEventTypes.SIGN_RESPONSE, error: (err as Error).message });
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
  publicKey,
  baseURL,
}: {
  content: QueuedSignRequest["content"];
  address: WalletType["address"];
  publicKey: string;
  baseURL?: string;
}): Promise<Jstz.Operation> {
  const jstzClient = new Jstz({
    baseURL,
    timeout: 6000,
  });

  const nonce = await jstzClient.accounts.getNonce(address).catch(() => Promise.resolve(0));

  return {
    content,
    nonce,
    publicKey,
  };
}

async function closeDuplicateWindows(currentWindowId?: number) {
  const windows = await chrome.windows.getAll();

  const popupsToDelete = windows.filter(
    (window) => window.type === "popup" && window.id !== currentWindowId,
  );

  for (const popup of popupsToDelete) {
    if (popup.id) {
      await chrome.windows.remove(popup.id);
    }
  }
}

function openWalletDialog(
  searchParams: Record<string, string> = {},
  callback: (window?: chrome.windows.Window) => void,
) {
  const params = new URLSearchParams({ isPopup: "true", ...searchParams });

  chrome.windows.create(
    {
      url: `index.html?${params}`,
      type: "popup",
      focused: true,
      width: 450,
      height: 650,
      // incognito, top, left, ...
    },
    callback,
  );
}
