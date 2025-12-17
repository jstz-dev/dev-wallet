import NavigationBar from "~/components/navigation-bar";

export default function SidebarLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen w-full">
      <NavigationBar />
      {children}
    </div>
  );
}
