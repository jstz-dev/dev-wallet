import { useQueryClient } from "@tanstack/react-query";

import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { type KeyStorage } from "~/lib/constants/storage";
import { useStorageLocal } from "~/lib/hooks/useStorageLocal";
import { spawn } from "~/lib/vault";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NavBar() {
  const { accountAddress } = useParams<{ accountAddress: string }>();
  const { data: accounts } = useStorageLocal<Record<string, KeyStorage>>("accounts");

  const { data: currentAddress } = useStorageLocal<string>("currentAddress");

  useEffect(() => {
    if (currentAddress && !accountAddress) return;

    void chrome.storage.local.set({ currentAddress: accountAddress });
  }, [currentAddress, accountAddress]);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleOnSelect(newValue: "generate" | (string & {})) {
    if (newValue !== "generate") return navigate(`/wallets/${newValue}`);

    const newAccount = await spawn();
    queryClient.invalidateQueries({ queryKey: ["local", "accounts"] });

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
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
