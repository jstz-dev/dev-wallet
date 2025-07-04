import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip.tsx";
import type { Accounts } from "~/lib/constants/storage.ts";
import { useVault } from "~/lib/vaultStore.ts";

import { Button } from "./ui/button";

interface AccountSelectProps {
  selectedAccount: string | undefined;
  canAddWallet?: boolean;
}

export function AccountSelect({ selectedAccount, canAddWallet = true }: AccountSelectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, setCurrentAddress, currentAddress } = useVault((state) => state);

  function handleOnSelect(newValue: string & {}) {
    setCurrentAddress(newValue);
    void navigate(`/wallets/${newValue}${location.search}`);
  }

  const selectedValueIndex = Object.keys(accounts).findIndex(
    (address) => address === selectedAccount,
  );

  function goToCreate() {
    void navigate(`/add-wallet${location.search}`);
  }

  function onAccountRemove(address: string) {
    const updatedAccounts: Accounts = {};

    Object.entries(accounts).forEach(([key, value]) => {
      if (key !== address) {
        updatedAccounts[key] = value;
      }
    });

    if (currentAddress === address) {
      const goToAccount = Object.keys(updatedAccounts)[0];
      if (goToAccount) {
        handleOnSelect(goToAccount);
      } else {
        setCurrentAddress("")
        goToCreate();
      }
    }
    // Update the accounts in the vault store
    useVault.getState().setAccounts(updatedAccounts);
  }

  return (
    Object.keys(accounts).length > 0 && (
      <Select value={selectedAccount} onValueChange={handleOnSelect}>
        <SelectTrigger className="dark:hover:bg-black-600 hover:bg-black-600 bg-black-800 dark:bg-black-800 rounded-md border-0">
          <SelectValue>Wallet {selectedValueIndex + 1}</SelectValue>
        </SelectTrigger>

        <SelectContent>
          {Object.entries(accounts).map(([address], i) => (
            <div key={address} className="flex items-center gap-2 px-1">
              <SelectItem value={address} className="mb-2 flex flex-col items-start rounded-md">
                <span>Wallet {i + 1}</span>
                <span className="text-sm text-white/40">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
              </SelectItem>

              <Tooltip>
                <TooltipTrigger asChild>
                  <X size={16} className="cursor-pointer" onClick={() => onAccountRemove(address)} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>WARNING! This will remove your account forever</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
