import { redirect, useNavigate, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import { spawnAndSave, addAccountToStorage } from "~/lib/vault";
import { ImportWalletForm } from "~/components/ImportWallet.form.tsx";
export async function loader(_args: LoaderFunctionArgs<any>) {
  const { currentAddress } = await chrome.storage.local.get("currentAddress");

    export async function loader(_args: LoaderFunctionArgs<any>) {
        const { currentAddress } = await chrome.storage.local.get("currentAddress");
        if (currentAddress) return redirect(`/wallets/${currentAddress}`);
        return null;
    }
    export default function Home() {
        const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await spawnAndSave();
      goToWallet(newAccount.address);
  }

    async function onImportWalletSubmit(form: {
        accountAddress: string;
        publicKey: string;
        privateKey: string;
    }) {
        console.log(form);
        await addAccountToStorage(form);
        goToWallet(form.accountAddress);
    }

    function goToWallet(address: string) {
        navigate(`/wallets/${address}`);
    }
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg">You don't have any account yet.</h2>

      <Button onClick={handleGenerate}>Generate</Button>
      <span>or</span>
      <p>Import existing wallet</p>
      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
