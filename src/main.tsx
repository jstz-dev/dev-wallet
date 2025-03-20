import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { popupRouter } from "./dialog-router";
import "./index.css";
import { router } from "./router";

const params = new URLSearchParams(window.location.search);
const isPopup = params.get("isPopup") === "true";

const queryClient = new QueryClient();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={isPopup ? popupRouter : router} />
    </QueryClientProvider>
  </StrictMode>,
);
