import { Jstz } from "@jstz-dev/jstz-client";

enum EventTypesEnum {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",

  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
}

export interface SignResponse {
  type: EventTypesEnum.SIGN_RESPONSE;
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

interface SignError {
  type: EventTypesEnum.SIGN_RESPONSE;
  error: string;
}

export interface GetAddressResponse {
  type: EventTypesEnum.GET_ADDRESS_RESPONSE;
  data: {
    accountAddress: string;
  };
}

// Listener for the global window messages
window.addEventListener(
  EventTypesEnum.SIGN,
  ((
    event: CustomEvent<{
      type: EventTypesEnum.SIGN;
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
  EventTypesEnum.GET_ADDRESS,
  ((
    event: CustomEvent<{
      type: EventTypesEnum.GET_ADDRESS;
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
    case EventTypesEnum.SIGN_RESPONSE: {
      const signResponseEvent = new CustomEvent(EventTypesEnum.SIGN_RESPONSE, { detail: response });
      window.dispatchEvent(signResponseEvent);
      break;
    }

    case EventTypesEnum.GET_ADDRESS_RESPONSE: {
      console.log(response);
      const getAddressResponseEvent = new CustomEvent(EventTypesEnum.GET_ADDRESS_RESPONSE, {
        detail: response,
      });

      window.dispatchEvent(getAddressResponseEvent);
      break;
    }
  }
});
