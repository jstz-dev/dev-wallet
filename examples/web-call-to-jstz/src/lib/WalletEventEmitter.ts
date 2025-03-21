export enum WalletEvents {
  SIGN = "SIGN",
  SIGN_RESPONSE = "SIGN_RESPONSE",
}

interface Data {
  type: WalletEvents;
  data?: unknown;
}

const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

export function sendMessage<T>(data: Data): Promise<T> {
  return new Promise((res) => {
    chrome.runtime.sendMessage(extensionId, data, {}, (response) => {
      res(response);
    });
  });
}

export function sendMessageSync<T>(data: Data, callback: (res: T) => void = () => {}) {
  chrome.runtime.sendMessage(extensionId, data, {}, callback);
}
