import { Jstz } from "@jstz-dev/jstz-client";

enum WalletEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",

  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",

  PROCESS_QUEUE = "PROCESS_QUEUE",
  DECLINE = "DECLINE",
}

export interface SignResponse {
  type: WalletEventTypes.SIGN_RESPONSE;
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

interface SignError {
  type: WalletEventTypes.SIGN_RESPONSE;
  error: string;
}

export interface GetAddressResponse {
  type: WalletEventTypes.GET_ADDRESS_RESPONSE;
  data: {
    accountAddress: string;
  };
}

// Listener for the global window messages
window.addEventListener(
  WalletEventTypes.SIGN,
  ((
    event: CustomEvent<{
      type: WalletEventTypes.SIGN;
      content: Jstz.Operation.RunFunction;
    }>,
  ) => {
    port.postMessage(
      JSON.stringify({ type: event.detail.type, data: { content: event.detail.content } }),
    );
  }) as EventListener,
  false,
);

// Listener for the global window messages
window.addEventListener(
  WalletEventTypes.GET_ADDRESS,
  ((
    event: CustomEvent<{
      type: WalletEventTypes.GET_ADDRESS;
    }>,
  ) => {
    port.postMessage(JSON.stringify({ type: event.detail.type }));
  }) as EventListener,
  false,
);

const port = chrome.runtime.connect();
// Listener to messages received from the background script (service-worker.ts)
port.onMessage.addListener((msg: string) => {
  const response = JSON.parse(msg) as SignResponse | SignError | GetAddressResponse;

  switch (response.type) {
    case WalletEventTypes.SIGN_RESPONSE: {
      const signResponseEvent = new CustomEvent(WalletEventTypes.SIGN_RESPONSE, {
        detail: response,
      });
      window.dispatchEvent(signResponseEvent);
      break;
    }

    case WalletEventTypes.GET_ADDRESS_RESPONSE: {
      const getAddressResponseEvent = new CustomEvent(WalletEventTypes.GET_ADDRESS_RESPONSE, {
        detail: response,
      });

      window.dispatchEvent(getAddressResponseEvent);
      break;
    }
  }
});
