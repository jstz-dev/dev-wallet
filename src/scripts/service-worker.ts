import { Wallet } from "~/lib/Wallet";
import { type Accounts } from "~/lib/constants/storage";

export enum WalletRequestEnum {
  SIGN = "SIGN",
  PROCESS_QUEUE = "PROCESS_QUEUE",
  SIGN_DECLINE = "SIGN_DECLINE",
}

interface WalletRequest {
  type: WalletRequestEnum;
  data?: unknown;
}

interface SignRequest extends WalletRequest {
  type: WalletRequestEnum.SIGN;
  data: {
    accountAddress: string;
    operation: Record<string, unknown>;
  };
}

function openWalletDialog(path = "") {
  const params = new URLSearchParams([
    ["isPopup", "true"],
    ["path", path],
  ]);

  void chrome.windows.create({
    url: `index.html?${params}`,
    type: "popup",
    focused: true,
    width: 400,
    height: 400,
    // incognito, top, left, ...
  });
}

interface ProcessQueueEvent extends WalletRequest {
  type: WalletRequestEnum.PROCESS_QUEUE;
  data: Accounts[string];
}

interface DeclineSignEvent extends WalletRequest {
  type: WalletRequestEnum.SIGN_DECLINE;
}

interface SignQueue {
  resolve: (res?: any) => void;
  operation: any;
}

const wallet = Wallet.instance;

const signQueue: SignQueue[] = [];

chrome.runtime.onMessageExternal.addListener(
  async (request: SignRequest, _sender, sendResponse) => {
    switch (request.type) {
      case WalletRequestEnum.SIGN: {
        const { operation } = request.data ?? {};

        const accounts = wallet.accounts;
        const currentAddress = wallet.currentAddress;

        if (Object.entries(accounts).length === 0) {
          openWalletDialog();

          signQueue.push({ resolve: sendResponse, operation: operation });
          return;
        }

        if (!accounts || !currentAddress || !accounts[currentAddress]) {
          openWalletDialog();
          sendResponse({ error: "No account found" });
          return;
        }

        const { publicKey, privateKey } = accounts[currentAddress] ?? {
          publicKey: "",
          privateKey: "",
        };

        if (!publicKey || !privateKey) {
          sendResponse({ error: "No proper public/private keypair found" });
          return;
        }

        openWalletDialog("confirmation-prompt");
        signQueue.push({ resolve: sendResponse, operation: operation });
        break;
      }
    }
  },
);

chrome.runtime.onMessage.addListener(
  async (request: ProcessQueueEvent | DeclineSignEvent, _sender, sendResponse) => {
    switch (request.type) {
      case WalletRequestEnum.PROCESS_QUEUE: {
        while (signQueue.length > 0) {
          const queueRequest = signQueue.shift();
          if (!queueRequest) break;

          const account = request.data;

          const signature = wallet.sign(
            account.privateKey!,
            queueRequest.operation as Record<string, unknown>,
          );

          queueRequest.resolve({
            signature,
            publicKey: account.publicKey,
          });
        }

        sendResponse({ message: "done" });
        break;
      }

      case WalletRequestEnum.SIGN_DECLINE: {
        while (signQueue.length > 0) {
          const queueRequest = signQueue.shift();
          if (!queueRequest) break;

          queueRequest.resolve({ error: "Signage declined by user." });
        }

        sendResponse({ message: "done" });
        break;
      }
    }
  },
);
