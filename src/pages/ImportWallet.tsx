import { ArrowLeft } from "lucide-react";
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
    <div className="flex w-full flex-col gap-4 p-4">
      <ArrowLeft onClick={() => navigate(-1)} className={'cursor-pointer'}/>
      <h3 className="text-2xl font-bold">Provide details of the imported wallet</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
