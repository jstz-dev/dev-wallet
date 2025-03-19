import { createBrowserRouter, Navigate } from "react-router";
import { type WalletType } from "~/lib/Wallet";
import ImportWallet from "~/pages/ImportWallet.page";
import Wallet from "~/pages/Wallet.page";

import { StorageKeys } from "./lib/constants/storage";
import ConfirmationPrompt from "./pages/ConfirmationPrompt.page";
import Home, { loader as homeLoader } from "./pages/Home.page";
import { WalletRequestEnum } from "./scripts/service-worker";

const params = new URLSearchParams(window.location.search);
const initialPath = params.get("path");

async function onGenerate(payload: WalletType) {
  await chrome.runtime.sendMessage({ type: WalletRequestEnum.PROCESS_QUEUE, data: payload });

  chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: payload.address });
  window.close();
}

export const popupRouter = createBrowserRouter([
  {
    path: "/404",
    element: <h1>Not found</h1>,
  },

  {
    path: "/index.html",
    element: <Navigate to={initialPath ? `/${initialPath}` : "/"} />,
  },

  {
    path: "/",
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <Home onGenerate={onGenerate} />,
      },

      {
        path: "confirmation-prompt",
        element: <ConfirmationPrompt />,
      },

      {
        path: "import-wallet",
        element: <ImportWallet onGenerate={onGenerate} />,
      },

      {
        path: "wallets/:accountAddress",
        element: <Wallet />,
      },
    ],
  },
]);
