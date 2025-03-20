import { createBrowserRouter, Navigate, Outlet } from "react-router";
import type { WalletType } from "~/lib/vault";
import ImportWallet from "~/pages/ImportWallet";
import Wallet from "~/pages/Wallet";

import { StorageKeys } from "./lib/constants/storage";
import ConfirmationPrompt from "./pages/ConfirmationPrompt";
import Home, { loader as homeLoader } from "./pages/Home";
import { WalletRequestEnum } from "./scripts/service-worker";

const params = new URLSearchParams(window.location.search);
const initialPath = params.get("path");

async function onGenerate(payload: WalletType) {
  await chrome.runtime.sendMessage({ type: WalletRequestEnum.PROCESS_QUEUE, data: payload });

  void chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: payload.address });
  window.close();
}
import NotFound from "./pages/NotFound";

export const popupRouter = createBrowserRouter([
  {
    path: "/404",
    element: <NotFound />,
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
