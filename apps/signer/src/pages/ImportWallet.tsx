import { Button } from "jstz-ui/ui/button";
import { Separator } from "jstz-ui/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { ImportWalletForm } from "~/components/ImportWallet.form";
import type { Account } from "~/lib/constants/storage";
import { useVault } from "~/lib/vaultStore";

export default function ImportWallet() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, setAccounts } = useVault((state) => state);

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
      <div className="flex w-full items-center gap-2">
        <Button onClick={() => navigate(-1)} variant="link">
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <h3 className="text-2xl font-bold capitalize">Import wallet</h3>
        </div>
      </div>

      <Separator />

      <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
