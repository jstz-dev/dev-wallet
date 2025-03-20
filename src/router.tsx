import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "~/layouts/RootLayout";
import Home, { loader as homeLoader } from "~/pages/Home";
import ImportWallet from "~/pages/ImportWallet";
import Wallet from "~/pages/Wallet";
import NotFound from "~/pages/NotFound.tsx";

export const router = createBrowserRouter([
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
