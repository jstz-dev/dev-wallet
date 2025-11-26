import { Button } from "jstz-ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "jstz-ui/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "jstz-ui/ui/tooltip";
import { ExternalLink, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import type { Accounts } from "~/lib/constants/storage.ts";
import { isPopup } from "~/lib/isPopup";
import { shortenAddress } from "~/lib/utils.ts";
import { useVault } from "~/lib/vaultStore.ts";

interface AccountSelectProps {
  selectedAccount: string | undefined;
  canAddWallet?: boolean;
  onAccountSelected?: (accountAddress: string) => void;
}

export function AccountSelect({
  selectedAccount,
  canAddWallet = true,
  onAccountSelected = () => {},
}: AccountSelectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, setCurrentAddress, currentAddress, setAccounts } = useVault((state) => state);

  function handleOnSelect(newValue: string & {}) {
    setCurrentAddress(newValue);
    onAccountSelected(newValue);
    void navigate(`/wallets/${newValue}${location.search}`);
  }

  const popup = isPopup();

  const selectedAddress = Object.entries(accounts).find(([address]) => address === selectedAccount);

  function openCreatePopup() {
    const params = new URLSearchParams({
      path: "/add-wallet",
    });

    void chrome.windows.create({
      url: `index.html?${params}`,
      type: "popup",
      focused: true,
      width: 450,
      height: 720,
      // incognito, top, left, ...
    });
  }

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
        setCurrentAddress("");
        goToCreate();
      }
    }
    // Update the accounts in the vault store
    setAccounts(updatedAccounts);
  }

  return (
    Object.keys(accounts).length > 0 && (
      <Select value={selectedAccount} onValueChange={handleOnSelect}>
        <SelectTrigger className="dark:hover:bg-black-600 hover:bg-black-600 bg-black-800 dark:bg-black-800 rounded-md border-0">
          <SelectValue>
            {selectedAddress?.[1]?.name ?? shortenAddress(selectedAddress?.[0])}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {Object.entries(accounts).map(([address, keyStorage]) => (
            <div key={address} className="flex items-center gap-2 px-1">
              <SelectItem
                value={address}
                key={address}
                className="mb-2 flex flex-col items-start rounded-md"
              >
                <span>{keyStorage.name ?? shortenAddress(address)}</span>
                <span className="text-sm text-white/40">{shortenAddress(address)}</span>
              </SelectItem>

              <Tooltip>
                <TooltipTrigger asChild>
                  <X
                    size={16}
                    className="cursor-pointer"
                    onClick={() => onAccountRemove(address)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>WARNING! This will remove your account forever</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}

          {canAddWallet && (
            <Button
              onClick={popup ? openCreatePopup : goToCreate}
              variant="secondary"
              className="w-full rounded-md text-sm"
              iconPosition="right"
              renderIcon={() => popup && <ExternalLink />}
            >
              Add Wallet
            </Button>
          )}
        </SelectContent>
      </Select>
    )
  );
}
