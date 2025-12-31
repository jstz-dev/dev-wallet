import { Card, CardContent, CardHeader } from "jstz-ui/ui/card";
import { BadgeDollarSign } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { SignInButton } from "~/lib/auth/buttons";

export default async function LoginPage(_props: PageProps<"/login">) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect("/");
  }

  return (
    <div className="flex min-h-dvh min-w-dvw flex-col items-center justify-center">
      <BadgeDollarSign aria-description="logo" className="h-9 w-36 max-w-full" />

      <p className="mt-5 mb-8 text-[#787D82]">Tezos market dapp</p>

      <Card className="h-68 w-[calc(100dvw-32px)] text-center md:mx-auto md:w-100">
        <CardHeader>
          <h1 className="text-2xl font-(--font-gt-esti)">Welcome back!</h1>
          <p>Please sign in to continue</p>
        </CardHeader>

        <CardContent className="flex grow flex-col justify-center gap-10">
          <SignInButton size="lg" />
        </CardContent>
      </Card>
    </div>
  );
}
