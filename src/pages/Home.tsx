import { redirect, useLocation, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import * as Vault from "~/lib/vault";
import { useVault, vault } from "~/lib/vaultStore";

export function loader({ request }: LoaderFunctionArgs) {
  const currentAddress = vault.getState().currentAddress;
  const searchParams = new URL(request.url).searchParams;

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`);
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const setCurrentAddress = useVault.use.setCurrentAddress();
  const addAccount = useVault.use.addAccount();

  async function handleGenerate() {
    const account = await Vault.spawn();

    addAccount(account);
    setCurrentAddress(account.address);
    void navigate(`/wallets/${account.address}${location.search}`);
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg">You don&apos;t have any account yet.</h2>

      <div className="flex items-center justify-between">
        <Button onClick={handleGenerate}>Generate new wallet</Button>

        <span className="text-xl font-semibold">- or -</span>

        <Button onClick={() => navigate("import-wallet")}>Import existing wallet</Button>
      </div>
    </div>
  );
}
