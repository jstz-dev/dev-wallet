import { redirect, type LoaderFunctionArgs } from "react-router";
import { vault } from "~/lib/vaultStore";

export function loader({ request }: LoaderFunctionArgs) {
  const currentAddress = vault.getState().currentAddress;
  const searchParams = new URL(request.url).searchParams;

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`);
  return redirect("/add-wallet");
}
