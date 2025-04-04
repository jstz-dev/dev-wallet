// import { useEffect } from "react";
import { Outlet } from "react-router";
import NavBar from "~/components/NavBar";
// import { WalletEventTypes } from "~/scripts/service-worker.ts";

export default function RootLayout() {
  // useEffect(() => {
  //   window.addEventListener("close", onClose);
  //   return () => window.removeEventListener("close", onClose);
  // }, []);
  //
  // function onClose() {
  //   void chrome.runtime.sendMessage({ type: WalletEventTypes.DECLINE });
  // }

  return (
    <div className="flex min-w-100 flex-col pb-4">
      <NavBar />

      <Outlet />
    </div>
  );
}
