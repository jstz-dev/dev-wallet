import { redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage";
import * as Vault from "~/lib/vault";
import type { WalletType } from "~/lib/vault";

export async function loader(_args: LoaderFunctionArgs) {
  const { currentAddress } = await chrome.storage.local.get(StorageKeys.CURRENT_ADDRESS);

  if (currentAddress) return redirect(`/wallets/${currentAddress}`);
  return null;
}

interface HomeProps {
  onGenerate?: (payload: WalletType) => void | Promise<void>;
}

export default function Home({ onGenerate }: HomeProps) {
  const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await Vault.spawnAndSave();
    void navigate(`/wallets/${newAccount.address}`);
    void onGenerate?.(newAccount);
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
