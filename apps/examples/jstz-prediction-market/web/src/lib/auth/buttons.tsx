import { Button, type ButtonProps } from "jstz-ui/ui/button";
import { cn } from "jstz-ui/utils";
import Form from "next/form";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from ".";

export function SignInButton(props: ButtonProps) {
  async function signIn() {
    "use server";
    const { url } = await auth.api.signInSocial({ body: { provider: "google", callbackURL: "/" } });

    redirect(url ?? "/");
  }

  return (
    <Form action={signIn}>
      <Button {...props} variant="outline" className={cn("w-60 rounded-full", props.className)}>
        <Image src="./google-icon.svg" alt="Google Logo" height="24" width="24" />

        <span className="text-lg">Sign in with Google</span>
      </Button>
    </Form>
  );
}

export function SignOutButton(props: ButtonProps) {
  async function signOut() {
    "use server";
    const { success } = await auth.api.signOut({ headers: await headers() });

    if (success) {
      redirect("/login");
    }
  }

  return (
    <Form action={signOut}>
      <Button {...props}>Logout</Button>
    </Form>
  );
}
