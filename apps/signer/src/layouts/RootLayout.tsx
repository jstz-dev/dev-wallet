import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "jstz-ui/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import NavBar from "~/components/NavBar";
import { ThemeProvider } from "~/lib/ThemeProvider";

const queryClient = new QueryClient();

const devtoolsEnabled = import.meta.env.VITE_TANSTACK_QUERY_DEVTOOLS_ENABLED === "true";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools/build/modern/production.js").then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <div className="min-w-100 flex flex-col pb-4">
              <NavBar />

              <Outlet />
            </div>

            {devtoolsEnabled && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
              </Suspense>
            )}
          </QueryClientProvider>
        </NuqsAdapter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
