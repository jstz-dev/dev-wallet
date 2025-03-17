import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, RouterProvider, Routes } from "react-router";
import * as Vault from "~/lib/vault";

import "./index.css";
import { StorageKeys } from "./lib/constants/storage";
import Home from "./pages/Home";
import { router } from "./router";
import { WalletEvents } from "./scripts/service-worker";

const params = new URLSearchParams(window.location.search);
const isPopup = params.get("isPopup") === "true";

async function onGenerate() {
  const newAccount = await Vault.spawnAndSave();
  await chrome.runtime.sendMessage({ type: WalletEvents.PROCESS_QUEUE, data: newAccount });

  chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: newAccount.address });
  window.close();
}

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isPopup ? (
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Home onGenerage={onGenerate} />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <RouterProvider router={router} />
      )}
    </QueryClientProvider>
  </StrictMode>,
);
