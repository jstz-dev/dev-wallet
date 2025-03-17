import {createBrowserRouter, Navigate, redirect} from "react-router";
import RootLayout from "~/layouts/RootLayout";
import Home, { loader as homeLoader } from "~/pages/Home";
import Wallet from "~/pages/Wallet";
import ImportWallet from "~/pages/ImportWallet.tsx";

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
  {
    path: "index.html",
    loader: () => redirect("/"),
  },
]);
