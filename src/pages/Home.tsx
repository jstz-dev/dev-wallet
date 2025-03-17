import { redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage";
import { spawnAndSave } from "~/lib/vault";

export async function loader(_args: LoaderFunctionArgs<any>) {
  const { current_address } = await chrome.storage.local.get(StorageKeys.CURRENT_ADDRESS);

  if (current_address) return redirect(`/wallets/${current_address}`);
  return null;
}

export default function Home() {
  const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await spawnAndSave();
    navigate(`/wallets/${newAccount.address}`);
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg">You don't have any account yet.</h2>

      <Button onClick={handleGenerate}>Generate</Button>
    </div>
  );
}
