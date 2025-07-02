import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "~/layouts/RootLayout";
import AddWallet from "~/pages/AddWallet";
import { loader as homeLoader } from "~/pages/Home";
import ImportWallet from "~/pages/ImportWallet";
import NotFound from "~/pages/NotFound.tsx";
import Wallet from "~/pages/Wallet";

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
      },

      {
        path: "add-wallet",
        element: <AddWallet />,
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
