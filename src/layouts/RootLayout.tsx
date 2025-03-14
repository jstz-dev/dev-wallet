import { Outlet } from "react-router";
import NavBar from "~/components/NavBar";

export default function RootLayout() {
  return (
    <div className="flex min-w-100 flex-col">
      <NavBar />

      <Outlet />
    </div>
  );
}
