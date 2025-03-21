import { Jstz } from "@jstz-dev/jstz-client";

const port = chrome.runtime.connect();

// Listener for the global window messages
window.addEventListener<"message">(
  "message",
  (
    event: MessageEvent<{
      type: "SIGN";
      data: {
        content: unknown;
      };
    }>,
  ) => {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }

    switch (event.data.type) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      case "SIGN": {
        port.postMessage(JSON.stringify(event.data));
        break;
      }
    }
  },
  false,
);

// Listener to messages received from the background script (service-worker.ts)
port.onMessage.addListener(function (msg: string) {
  const response = JSON.parse(msg) as
    | {
      type: "SIGN_RESPONSE";
        data: {
          operation: Jstz.Operation;
          signature: string;
          publicKey: string;
          accountAddress: string;
        };
      }
    | {
      type: "SIGN_RESPONSE";
        error: string;
      };
  switch (response.type) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case "SIGN_RESPONSE": {
      window.postMessage(response, "*");
      break;
    }
  }
});
