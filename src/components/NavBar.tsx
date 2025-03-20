import { useQueryClient } from "@tanstack/react-query";

import { Download, Plus } from "lucide-react";
import { useEffect } from "react";
import {useLocation, useNavigate, useParams} from "react-router";
import { StorageKeys, type Accounts } from "~/lib/constants/storage";
import { storageKeys, useStorageLocal } from "~/lib/hooks/useStorageLocal";
import * as Vault from "~/lib/vault";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NavBar() {
  const { accountAddress } = useParams<{ accountAddress: string }>();
  const { data: accounts } = useStorageLocal<Accounts>(StorageKeys.ACCOUNTS);

  const { data: currentAddress, refetch } = useStorageLocal<string>(StorageKeys.CURRENT_ADDRESS);

  useEffect(() => {
    if (currentAddress && !accountAddress) return;

    void chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: accountAddress }).then(() => {
      void refetch();
    });
  }, [currentAddress, accountAddress, refetch]);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  async function handleOnSelect(newValue: "generate" | (string & {})) {
    if (newValue === "import") return navigate(`/import-wallet${location.search}`);

    if (newValue !== "generate") return navigate(`/wallets/${newValue}${location.search}`);

    const newAccount = await Vault.spawnAndSave();
    await queryClient.invalidateQueries({ queryKey: storageKeys.local(StorageKeys.ACCOUNTS) });

    return navigate(`/wallets/${newAccount.address}${location.search}`);
  }

  return (
    <div className="flex justify-between bg-[#5271FF] p-2">
      <div className={"flex justify-start gap-4"}>
        <img src={"/jstz_icon.png"} alt={"jstz"} className={"h-10 w-10"} />
        <h1 className="my-auto text-lg font-bold text-[#000000]">Jstz wallet</h1>
      </div>

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
