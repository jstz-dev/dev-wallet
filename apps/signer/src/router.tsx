import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "~/layouts/RootLayout";
import Home, { loader as homeLoader } from "~/pages/home/Home";
import ImportWallet from "~/pages/ImportWallet";
import NotFound from "~/pages/NotFound.tsx";
import Wallet from "~/pages/wallet/Wallet";

export const router = createBrowserRouter([
  {
    path: "/404",
    element: <NotFound />,
  },

  {
    path: "/index.html",
    element: <Navigate to={`/${location.search}`} />,
  },

  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <Home />,
      },

      {
        path: "add-wallet",
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
