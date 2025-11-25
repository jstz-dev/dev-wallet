import { PasskeyProvider } from "passkeys-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { WindowContextProvider } from "~/lib/Window.context.tsx";
import "./index.css";
import { RP_ID } from "./lib/constants/RP_ID";
import { userStore } from "./lib/passkeys/userStore";
import { router } from "./router";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <WindowContextProvider>
      <PasskeyProvider userStore={userStore} RP_ID={RP_ID} extensionId={chrome.runtime.id}>
        <RouterProvider router={router} />
      </PasskeyProvider>
    </WindowContextProvider>
  </StrictMode>,
);
