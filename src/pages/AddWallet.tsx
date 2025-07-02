import { Link, useLocation, useNavigate } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import * as Vault from "~/lib/vault";
import { useVault } from "~/lib/vaultStore";

export default function AddWallet() {
  const navigate = useNavigate();
  const location = useLocation();

  const setCurrentAddress = useVault.use.setCurrentAddress();
  const addAccount = useVault.use.addAccount();

  async function handleGenerate() {
    const account = await Vault.spawn();

    addAccount(account);
    setCurrentAddress(account.address);
    void navigate(`/wallets/${account.address}${location.search}`);
  }

  return (
    <div className="flex flex-col justify-center gap-8 p-4">
      <div className="flex flex-col items-center justify-between gap-3">
        <Button
          variant="secondary"
          className="w-full rounded-md capitalize"
          onClick={handleGenerate}
        >
          Create wallet
        </Button>

        <Link
          to={`/import-wallet${location.search}`}
          className={buttonVariants({
            variant: "ghost",
            className: "bg-black-600 w-full rounded-md capitalize hover:bg-white/10",
          })}
        >
          Import wallet
        </Link>
      </div>
    </div>
  );
}
