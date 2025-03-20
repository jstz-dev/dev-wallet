import { redirect, useLocation, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage";
import * as Vault from "~/lib/vault";

export async function loader({ request }: LoaderFunctionArgs) {
  const { currentAddress } = await chrome.storage.local.get(StorageKeys.CURRENT_ADDRESS);
  const searchParams = new URL(request.url).searchParams;

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`); return null;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleGenerate() {
    const newAccount = await Vault.spawnAndSave();
    await chrome.storage.local.set({ currentAddress: newAccount.address });
    void navigate(`/wallets/${newAccount.address}${location.search}`);
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
