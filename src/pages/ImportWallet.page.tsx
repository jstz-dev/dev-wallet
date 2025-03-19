import { useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form.tsx";
import { type WalletType } from "~/lib/Wallet";
import { useWallet } from "~/lib/hooks/useWallet";

interface ImportWalletProps {
  onGenerate?: (payload: WalletType) => void | Promise<void>;
}

export default function ImportWallet({ onGenerate }: ImportWalletProps) {
  const navigate = useNavigate();

  const wallet = useWallet();

  async function onImportWalletSubmit(form: WalletType) {
    await wallet.addAccount(form);
    goToWallet(form.address);
    onGenerate?.(form);
  }

  function goToWallet(address: string) {
    navigate(`/wallets/${address}`);
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      <h3 className="text-lg font-bold">Provide details of wallet to import</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
