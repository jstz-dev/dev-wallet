import { createBrowserRouter, redirect } from "react-router";
import RootLayout from "~/layouts/RootLayout";
import Home from "~/pages/Home";
import Wallet from "~/pages/Wallet";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "wallets/:address",
        element: <Wallet />,
      },
    ],
  },
  {
    path: "index.html",
    loader: () => redirect("/"),
  },
]);
