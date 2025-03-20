import { redirect, useLocation, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage";
import * as Vault from "~/lib/vault";

export async function loader({ request }: LoaderFunctionArgs) {
  const { currentAddress } = await chrome.storage.local.get(StorageKeys.CURRENT_ADDRESS);
  const searchParams = new URL(request.url).searchParams;

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`);
  return null;
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
    <div className="flex flex-col gap-8 p-4 justify-center">
      <h3 className="text-2xl font-bold">You don&apos;t have any account yet...</h3>

      <div className="flex flex-col items-center justify-between gap-3">
        <Button onClick={handleGenerate}>Generate new wallet</Button>

        <span className="text-xl font-semibold">- or -</span>

        <Button onClick={() => navigate("import-wallet")}>Import existing wallet</Button>
      </div>
    </div>
  );
}
