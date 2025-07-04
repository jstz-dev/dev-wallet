import { useLocation, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { useVault } from "~/lib/vaultStore.ts";

import { Button } from "./ui/button";
import { shortenAddress } from "~/lib/utils.ts";

interface AccountSelectProps {
  selectedAccount: string | undefined;
  canAddWallet?: boolean;
}

export function AccountSelect({ selectedAccount, canAddWallet = true }: AccountSelectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, setCurrentAddress } = useVault((state) => state);

  function handleOnSelect(newValue: string & {}) {
    setCurrentAddress(newValue);
    void navigate(`/wallets/${newValue}${location.search}`);
  }

  const selectedAddress = Object.entries(accounts).find(
    ([address]) => address === selectedAccount,
  );

  function goToCreate() {
    void navigate(`/add-wallet${location.search}`);
  }

  return (
    Object.keys(accounts).length > 0 && (
      <Select value={selectedAccount} onValueChange={handleOnSelect}>
        <SelectTrigger className="dark:hover:bg-black-600 hover:bg-black-600 bg-black-800 dark:bg-black-800 rounded-md border-0">
          <SelectValue>{selectedAddress?.[1]?.name ?? shortenAddress(selectedAddress?.[0])}</SelectValue>
        </SelectTrigger>

        <SelectContent>
          {Object.entries(accounts).map(([address, keyStorage]) => (
            <SelectItem
              value={address}
              key={address}
              className="mb-2 flex flex-col items-start rounded-md"
            >
              <span>{keyStorage.name ?? shortenAddress(address)}</span>
              <span className="text-sm text-white/40">{shortenAddress(address)}</span>
            </SelectItem>
          ))}

          {canAddWallet && (
            <Button onClick={goToCreate} variant="secondary" className="w-full rounded-md text-sm">
              Add Wallet
            </Button>
          )}
        </SelectContent>
      </Select>
    )
  );
}
