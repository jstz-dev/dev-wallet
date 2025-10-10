import { Button, buttonVariants } from "jstz-ui/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, redirect, useLocation, useNavigate, type LoaderFunctionArgs } from "react-router";
import { AccountSelect } from "~/components/AccountSelect";
import * as Vault from "~/lib/vault";
import { useVault, vault } from "~/lib/vaultStore";

export function loader({ request }: LoaderFunctionArgs) {
  const currentAddress = vault.getState().currentAddress;
  const searchParams = new URL(request.url).searchParams;

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`);
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentAddress = useVault.use.currentAddress();
  const setCurrentAddress = useVault.use.setCurrentAddress();
  const addAccount = useVault.use.addAccount();

  async function handleGenerate() {
    const account = await Vault.spawn();

    addAccount(account);
    setCurrentAddress(account.address);
    goToWallet(account.address);
  }

  function goToWallet(address: string) {
    void navigate(`/wallets/${address}${location.search}`);
  }

  return (
    <div className="flex flex-col justify-center gap-8 p-4">
      <div className="flex flex-col items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2">
          {!!currentAddress && (
            <Button onClick={() => goToWallet(currentAddress)} variant="link">
              <ArrowLeft />
            </Button>
          )}

          <div className="flex-1">
            <AccountSelect selectedAccount={currentAddress} canAddWallet={false} />
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full rounded-md capitalize"
          onClick={handleGenerate}
        >
          Create wallet
        </Button>

        <Link
          to="/create-passkey-wallet"
          className={buttonVariants({
            variant: "secondary",
            className: "w-full rounded-md capitalize",
          })}
        >
          Create passkey wallet
        </Link>

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
