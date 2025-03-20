import { createBrowserRouter, Navigate } from "react-router";
import ImportWallet from "~/pages/ImportWallet";
import Wallet from "~/pages/Wallet";

import Home, { loader as homeLoader } from "./pages/Home";
import NotFound from "./pages/NotFound";

export const popupRouter = createBrowserRouter([
  {
    path: "/404",
    element: <NotFound />,
  },

  {
    path: "/index.html",
    element: <Navigate to={`/${window.location.search}`} />,
  },

  {
    path: "/",
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <Home />,
      },

      {
        path: "import-wallet",
        element: <ImportWallet />,
      },

      {
        path: "wallets/:accountAddress",
        element: <Wallet />,
      },
    ],
  },
]);
