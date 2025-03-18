import { createBrowserRouter } from "react-router";
import * as Vault from "~/lib/vault";

import { StorageKeys } from "./lib/constants/storage";
import Home from "./pages/Home";
import { WalletEvents } from "./scripts/service-worker";

async function onGenerate() {
  const newAccount = await Vault.spawnAndSave();
  await chrome.runtime.sendMessage({ type: WalletEvents.PROCESS_QUEUE, data: newAccount });

  chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: newAccount.address });
  window.close();
}

export const popupRouter = createBrowserRouter([
  {
    path: "*",
    element: <Home onGenerate={onGenerate} />,
  },
]);
