enum WalletEvents {
  GET_COUNTER = "GET_COUNTER",
  SET_COUNTER = "SET_COUNTER",
}

interface Data {
  type: WalletEvents;
  data?: unknown;
}

chrome.runtime.onMessageExternal.addListener(async (request: Data, _sender, sendResponse) => {
  switch (request.type) {
    case WalletEvents.GET_COUNTER: {
      const data = await chrome.storage.local.get("counter");

      if (!data?.counter) {
        chrome.storage.local.set({ counter: 0 });
        data.counter = 0;
      }

      sendResponse({ counter: data.counter });
      break;
    }

    case WalletEvents.SET_COUNTER: {
      await chrome.storage.local.set({ counter: request.data });
      sendResponse({ counter: request.data });
      break;
    }
  }
});
