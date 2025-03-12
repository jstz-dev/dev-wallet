import { EventTypes } from "./event-listener";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Received message:", message);

  switch (message.type) {
    case EventTypes.GREET:
      sendResponse({ reply: "Hello from the background script!" });
  }
});
