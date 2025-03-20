import { useLocation, useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form.tsx";
import { addAccountToStorage } from "~/lib/vault";

export default function ImportWallet() {
  const navigate = useNavigate();
  const location = useLocation();

  async function onImportWalletSubmit(form: {
    address: string;
    publicKey: string;
    privateKey: string;
  }) {
    await addAccountToStorage(form);
    void navigate(`/wallets/${form.address}${location.search}`);
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      <h3 className="text-lg font-bold">Provide details of wallet to import</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
