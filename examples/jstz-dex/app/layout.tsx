import type { Metadata } from "next";

import { AssetsContextProvider } from "@/contexts/assets.context";
import { WalletContextProvider } from "@/contexts/wallet.context";

import "./globals.css";

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          <AssetsContextProvider>{children}</AssetsContextProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
