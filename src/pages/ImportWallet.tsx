import { useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form.tsx";
import { addAccountToStorage, type WalletType } from "~/lib/vault";

interface ImportWalletProps {
  onGenerate?: (payload: WalletType) => void | Promise<void>;
}

export default function ImportWallet({ onGenerate }: ImportWalletProps) {
  const navigate = useNavigate();

  async function onImportWalletSubmit(form: {
    address: string;
    publicKey: string;
    privateKey: string;
  }) {
    await addAccountToStorage(form);
    void navigate(`/wallets/${form.address}`);
    void onGenerate?.(form);
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      <h3 className="text-lg font-bold">Provide details of wallet to import</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
