import { createBrowserRouter, Navigate, Outlet } from "react-router";
import type { WalletType } from "~/lib/vault";
import ImportWallet from "~/pages/ImportWallet.page";
import Wallet from "~/pages/Wallet.page";

import { StorageKeys } from "./lib/constants/storage";
import { WalletEvents } from "./scripts/service-worker";
import Home, { loader as homeLoader } from "./pages/Home.page";

async function onGenerate(payload: WalletType) {
  await chrome.runtime.sendMessage({ type: WalletEvents.PROCESS_QUEUE, data: payload });

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
    element: <Navigate to="/" />,
  },
  {
    path: "/",
    element: (
      <div>
        <Outlet />
      </div>
    ),
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <Home onGenerate={onGenerate} />,
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
