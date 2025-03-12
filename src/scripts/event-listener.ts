export enum EventTypes {
  GREET = "GREET",
}

interface EventData {
  type: EventTypes | (string & NonNullable<unknown>);
}

function onMessage(event: MessageEvent<EventData>) {
  if (event.source !== window) return;

  switch (event.data.type) {
    case EventTypes.GREET:
      chrome.runtime.sendMessage(event.data, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          return;
        }

        // Forward the reply back to the webpage
        window.postMessage({ type: "GREET", data: response }, "*");
      });
      break;

    default:
      console.log("Unhandled event: ", event.data.type);
  }
}

window.addEventListener("message", onMessage);
