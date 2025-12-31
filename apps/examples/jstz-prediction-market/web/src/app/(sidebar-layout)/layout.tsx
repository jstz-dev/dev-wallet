import { LogOut } from "lucide-react";
import Form from "next/form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NavigationBar from "~/components/navigation-bar";
import { SidebarMenuButton } from "~/components/ui/sidebar";
import { auth } from "~/lib/auth";
import ProtectedLayout from "~/lib/auth/protected-layout";

export default function SidebarLayout({ children }: LayoutProps<"/">) {
  async function signOut() {
    "use server";
    const { success } = await auth.api.signOut({ headers: await headers() });

    if (success) {
      redirect("/login");
    }
  }

  return (
    <ProtectedLayout>
      <div className="flex min-h-screen w-full">
        <NavigationBar>
          <Form action={signOut}>
            <SidebarMenuButton className="cursor-pointer">
              <LogOut />
              Logout
            </SidebarMenuButton>
          </Form>
        </NavigationBar>

        {children}
      </div>
    </ProtectedLayout>
  );
}
