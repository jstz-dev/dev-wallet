import { useEffect } from "react";
import { Outlet } from "react-router";
import NavBar from "~/components/NavBar";
import { TooltipProvider } from "~/components/ui/tooltip.tsx";
import { ThemeProvider } from "~/lib/ThemeProvider";
import { ResponseEventTypes } from "~/scripts/service-worker.ts";

export default function RootLayout() {
  useEffect(() => {
    window.addEventListener("beforeunload", onClose, { once: true });
  }, []);

  function onClose() {
    void chrome.runtime.sendMessage({ type: ResponseEventTypes.DECLINE });
    window.close();
    return false;
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <div className="flex min-w-100 flex-col pb-4">
          <NavBar />

          <Outlet />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
