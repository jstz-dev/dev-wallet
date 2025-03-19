import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "~/layouts/Root.layout";
import Home, { loader as homeLoader } from "~/pages/Home.page";
import ImportWallet from "~/pages/ImportWallet.page";
import Wallet from "~/pages/Wallet.page";

export const router = createBrowserRouter([
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
    element: <RootLayout />,
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
