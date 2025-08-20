import { TooltipProvider } from "jstz-ui/ui/tooltip";
import { Outlet } from "react-router";
import NavBar from "~/components/NavBar";
import { ThemeProvider } from "~/lib/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <div className="min-w-100 flex flex-col pb-4">
          <NavBar />

          <Outlet />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
