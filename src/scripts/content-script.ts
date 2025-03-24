import { Jstz } from "@jstz-dev/jstz-client";

export enum EventTypesEnum {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
}

export type SignResponse = {
  type: EventTypesEnum.SIGN_RESPONSE;
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
};

type SignError = {
  type: EventTypesEnum.SIGN_RESPONSE;
  error: string;
};

// Listener for the global window messages
window.addEventListener(
  EventTypesEnum.SIGN,
  ((
    event: CustomEvent<{
      type: EventTypesEnum.SIGN;
      content: Jstz.Operation.RunFunction;
    }>,
  ) => {
    try {
      port.postMessage(
          JSON.stringify({ type: event.detail.type, data: { content: event.detail.content } }),
      );
    } catch (err: any) {
      alert(err.message)
    }

  }) as EventListener,
  false,
);

const port = chrome.runtime.connect();
// Listener to messages received from the background script (service-worker.ts)
port.onMessage.addListener(function (msg: string) {
  const response = JSON.parse(msg) as SignResponse | SignError;
  switch (response.type) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case EventTypesEnum.SIGN_RESPONSE: {
      const signResponseEvent = new CustomEvent(EventTypesEnum.SIGN_RESPONSE, { detail: response });
      window.dispatchEvent(signResponseEvent);
      break;
    }
  }
});
