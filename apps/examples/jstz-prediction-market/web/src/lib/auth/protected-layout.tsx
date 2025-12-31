import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { auth } from ".";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("login");
  }

  return children;
}
