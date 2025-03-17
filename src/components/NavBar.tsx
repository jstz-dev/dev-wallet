import { useQueryClient } from "@tanstack/react-query";

import {Download, Plus} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { StorageKeys, type Accounts } from "~/lib/constants/storage";
import { storageKeys, useStorageLocal } from "~/lib/hooks/useStorageLocal";
import { spawnAndSave } from "~/lib/vault";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NavBar() {
  const { accountAddress } = useParams<{ accountAddress: string }>();
  const { data: accounts } = useStorageLocal<Accounts>(StorageKeys.ACCOUNTS);

  const { data: currentAddress, refetch } = useStorageLocal<string>(StorageKeys.CURRENT_ADDRESS);

  useEffect(() => {
    if (currentAddress && !accountAddress) return;

    chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: accountAddress }).then(() => {
      refetch();
    });
  }, [currentAddress, accountAddress]);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleOnSelect(newValue: "generate" | (string & {})) {
    if (newValue === "import") {
      navigate('/import-wallet');
      return
    }
    if (newValue !== "generate") return navigate(`/wallets/${newValue}`);

    const newAccount = await spawnAndSave();
    await queryClient.invalidateQueries({ queryKey: storageKeys.local(StorageKeys.ACCOUNTS) });

    navigate(`/wallets/${newAccount.address}`);
  }

  return (
    <div className="flex justify-between bg-slate-300 p-2">
      <h1 className="my-auto text-lg font-bold text-slate-900">Dev Wallet</h1>

      {currentAddress && (
        <Select value={currentAddress} onValueChange={handleOnSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {accounts &&
              Object.entries(accounts).map(([address], i) => (
                <SelectItem value={address} key={address}>
                  Account {i + 1}
                </SelectItem>
              ))}

            <SelectItem value="generate">
              Generate <Plus />
            </SelectItem>
            <SelectItem value="import">
              Import <Download />
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
