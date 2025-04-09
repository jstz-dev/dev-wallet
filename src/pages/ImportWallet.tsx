import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form";
import type { Account } from "~/lib/constants/storage";
import { useVault } from "~/lib/vaultStore";

export default function ImportWallet() {
  const navigate = useNavigate();
  const location = useLocation();

  const accounts = useVault.use.accounts();
  const setAccounts = useVault.use.setAccounts();

  function onImportWalletSubmit({ address, privateKey, publicKey }: Account) {
    setAccounts({
      ...accounts,
      [address]: {
        publicKey,
        privateKey,
      },
    });

    void navigate(`/wallets/${address}${location.search}`);
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer" />

      <h3 className="text-2xl font-bold">Import account</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
