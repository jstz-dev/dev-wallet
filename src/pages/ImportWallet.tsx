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
    <div className="flex flex-col gap-2 px-2">
      <h3 className="text-lg font-bold">Provide details of wallet to import</h3>

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
