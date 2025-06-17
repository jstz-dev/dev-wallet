import type { Metadata } from "next";

import { AssetsContextProvider } from "@/contexts/assets.context";
import { WalletContextProvider } from "@/contexts/wallet.context";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AssetsContextProvider>
          <WalletContextProvider>{children}</WalletContextProvider>
        </AssetsContextProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
