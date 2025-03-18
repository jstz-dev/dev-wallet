import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import "./index.css";
import { popupRouter } from "./popup-router";
import { router } from "./router";

const params = new URLSearchParams(window.location.search);
const isPopup = params.get("isPopup") === "true";

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={isPopup ? popupRouter : router} />
    </QueryClientProvider>
  </StrictMode>,
);
