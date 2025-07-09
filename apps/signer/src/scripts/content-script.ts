import Jstz from "@jstz-dev/jstz-client";

// TODO: move to jstz-client
module JstzSigner {
  export enum SignerResponseEventTypes {
    CHECK_STATUS_RESPONSE = "JSTZ_CHECK_EXTENSION_AVAILABILITY_RESPONSE_FROM_EXTENSION",
    SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
    GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
    ERROR = "JSTZ_ERROR_FROM_EXTENSION",
  }

  export enum SignerRequestEventTypes {
    CHECK_STATUS = "JSTZ_CHECK_EXTENSION_AVAILABILITY_REQUEST_TO_EXTENSION",
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

  export interface CheckStatusCall {
    type: SignerRequestEventTypes.CHECK_STATUS;
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

  export interface CheckStatusResponse {
    success: boolean;
  }
}

function sendEventToClient(
  payload:
    | JstzSigner.ExtensionResponse<
        JstzSigner.SignResponse | JstzSigner.GetAddressResponse | JstzSigner.CheckStatusResponse
      >
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
      | JstzSigner.ExtensionResponse<
          JstzSigner.SignResponse | JstzSigner.GetAddressResponse | JstzSigner.CheckStatusResponse
        >
      | JstzSigner.ExtensionError,
  );
}

async function wakeUpExtension(attempt = 0) {
  const maxAttempts = 10;

  try {
    await chrome.runtime.sendMessage(chrome.runtime.id, {
      type: JstzSigner.SignerRequestEventTypes.CHECK_STATUS,
    });
  } catch (e) {
    console.log(`${attempt + 1} to wake up extension failed. Retrying...`);
    if (attempt >= maxAttempts) {
      console.error("Failed to wake up extension after multiple attempts.");
      throw new Error("Failed to wake up extension.");
    }
    await wakeUpExtension(attempt + 1)
  }
}

async function postMessage(payload: unknown) {
  try {
    await wakeUpExtension();
    const response: string = await chrome.runtime.sendMessage(chrome.runtime.id, payload);
    onExtensionResponse(response);
  } catch (e) {
    console.error("Error while sending request to background script", e);
  }
}

// Listener for all the global window messages of type: WalletEventTypes
Object.entries(JstzSigner.SignerRequestEventTypes).forEach(([_, eventType]) => {
  window.addEventListener(
    eventType,
    ((
      event: CustomEvent<
        JstzSigner.SignRequestCall | JstzSigner.GetSignerAddressCall | JstzSigner.CheckStatusCall
      >,
    ) => {
      void postMessage({ type: event.detail.type, data: event.detail });
    }) as EventListener,
    false,
  );
});
