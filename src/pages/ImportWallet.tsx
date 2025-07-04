import { useLocation, useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form";
import { Separator } from "~/components/ui/separator";
import type { Account } from "~/lib/constants/storage";
import { useVault } from "~/lib/vaultStore";

export default function ImportWallet() {
  const navigate = useNavigate();
  const location = useLocation();

  const accounts = useVault.use.accounts();
  const setAccounts = useVault.use.setAccounts();

  function onImportWalletSubmit({ name, address, privateKey, publicKey }: Account) {
    setAccounts({
      ...accounts,
      [address]: {
        name,
        publicKey,
        privateKey,
      },
    });

    void navigate(`/wallets/${address}${location.search}`);
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <h3 className="text-2xl font-bold capitalize">Import wallet</h3>

      <Separator />

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
