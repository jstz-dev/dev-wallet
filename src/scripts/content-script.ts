import { Jstz } from "@jstz-dev/jstz-client";

enum ResponseEventTypes {
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
  ERROR = "JSTZ_ERROR_FROM_EXTENSION",
}

enum RequestEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

interface SignRequest {
  type: RequestEventTypes.SIGN;
  content: Jstz.Operation.RunFunction;
}

interface AddressRequest {
  type: RequestEventTypes.GET_ADDRESS;
}

export interface SignResponse {
  type: ResponseEventTypes.SIGN_RESPONSE;
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

interface ErrorResponse {
  type: ResponseEventTypes;
  error: string;
}

export interface GetAddressResponse {
  type: ResponseEventTypes.GET_ADDRESS_RESPONSE;
  data: {
    accountAddress: string;
  };
}

function sendEventToClient(payload: SignResponse | ErrorResponse | GetAddressResponse) {
  const responseEvent = new CustomEvent(payload.type, {
    detail: payload,
  });

  window.dispatchEvent(responseEvent);
}

function onExtensionResponse(response?: string) {
  if (!response) {
    sendEventToClient({ type: ResponseEventTypes.ERROR, error: "No response from extension" });
    return;
  }

  sendEventToClient(JSON.parse(response) as SignResponse | ErrorResponse | GetAddressResponse);
}

async function postMessage(payload: unknown) {
  try {
    const response: string = await chrome.runtime.sendMessage(chrome.runtime.id, payload);
    onExtensionResponse(response);
  } catch (e) {
    console.error("Error while sending sign request to background script", e);
  }
}

// Listener for all the global window messages of type: WalletEventTypes
Object.entries(RequestEventTypes).forEach(([_, eventType]) => {
  window.addEventListener(
    eventType,
    ((event: CustomEvent<SignRequest | AddressRequest>) => {
      void postMessage({ type: event.detail.type, data: event.detail });
    }) as EventListener,
    false,
  );
});
