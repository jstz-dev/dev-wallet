import { useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form.tsx";
import { Button } from "~/components/ui/button";
import { addAccountToStorage, spawn } from "~/lib/vault";

export default function App() {
  const navigate = useNavigate();

  async function handleGenerate() {
    const newAccount = await spawn();
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
