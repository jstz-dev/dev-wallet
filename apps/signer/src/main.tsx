import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import "./index.css";
import { router } from "./router";
import {WindowContextProvider} from "~/lib/Window.context.tsx";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("app")!).render(
  <StrictMode>
      <WindowContextProvider>
        <RouterProvider router={router} />
      </WindowContextProvider>
  </StrictMode>,
);
