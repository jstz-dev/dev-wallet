import { redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage.ts";
import { spawnAndSave } from "~/lib/vault";

export async function loader(_args: LoaderFunctionArgs<any>) {
  const { currentAddress } = await chrome.storage.local.get(StorageKeys.CURRENT_ADDRESS);

  if (currentAddress) return redirect(`/wallets/${currentAddress}`);
  return null;
}

function Home() {
  const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await spawnAndSave();
    goToWallet(newAccount.address);
  }

  function goToWallet(address: string) {
    navigate(`/wallets/${address}`);
  }
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg">You don't have any account yet.</h2>

      <Button onClick={handleGenerate}>Generate new wallet</Button>
      <span>or</span>
      <Button onClick={() => navigate("import-wallet")}>Import existing wallet</Button>
    </div>
  );
}

export default Home;
