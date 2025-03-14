export enum WalletEvents {
  SIGN_OPERATION = "SIGN_OPERATION",
}

interface Data {
  type: WalletEvents;
  data?: unknown;
}

const extensionId = "fkfcpeoebjpbnbbcbdaiabcmokdfhipl";

export function sendMessage<T>(data: Data): Promise<T> {
  return new Promise((res) => {
    chrome.runtime.sendMessage(extensionId, data, {}, (response) => {
      res(response);
    });
  });
}

export function sendMessageSync<T>(
  data: Data,
  callback: (res: T) => void = () => {},
) {
  chrome.runtime.sendMessage(extensionId, data, {}, callback);
}
