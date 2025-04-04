import Jstz from "@jstz-dev/jstz-client";

// TODO: move to jstz-client
module JstzSigner {
  export enum SignerResponseEventTypes {
    SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
    GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
    ERROR = "JSTZ_ERROR_FROM_EXTENSION",
  }

  export enum SignerRequestEventTypes {
    SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
    GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  }

  export interface ExtensionError {
    type: SignerResponseEventTypes;
    error: string;
  }

  export interface ExtensionResponse<T = unknown> {
    type: SignerResponseEventTypes;
    data: T;
  }

  export interface SignRequestCall {
    type: SignerRequestEventTypes.SIGN;
    content: Jstz.Operation.RunFunction;
  }

  export interface GetSignerAddressCall {
    type: SignerRequestEventTypes.GET_ADDRESS;
  }

  export interface SignResponse {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  }

  export interface GetAddressResponse {
    accountAddress: string;
  }
}

function sendEventToClient(
  payload:
    | JstzSigner.ExtensionResponse<JstzSigner.SignResponse | JstzSigner.GetAddressResponse>
    | JstzSigner.ExtensionError,
) {
  const responseEvent = new CustomEvent(payload.type, {
    detail: payload,
  });

  window.dispatchEvent(responseEvent);
}

function onExtensionResponse(response?: string) {
  if (!response) {
    sendEventToClient({
      type: JstzSigner.SignerResponseEventTypes.ERROR,
      error: "No response from extension",
    });
    return;
  }

  sendEventToClient(
    JSON.parse(response) as
      | JstzSigner.ExtensionResponse<JstzSigner.SignResponse | JstzSigner.GetAddressResponse>
      | JstzSigner.ExtensionError,
  );
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
Object.entries(JstzSigner.SignerRequestEventTypes).forEach(([_, eventType]) => {
  window.addEventListener(
    eventType,
    ((event: CustomEvent<JstzSigner.SignRequestCall | JstzSigner.GetSignerAddressCall>) => {
      void postMessage({ type: event.detail.type, data: event.detail });
    }) as EventListener,
    false,
  );
});
