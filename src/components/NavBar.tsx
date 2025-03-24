import { Download, Plus } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";
import * as Vault from "~/lib/vault";
import { useVault } from "~/lib/vaultStore";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NavBar() {
  const { accountAddress } = useParams<{ accountAddress: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, setCurrentAddress, addAccount } = useVault((state) => state);

  async function handleOnSelect(newValue: "generate" | "import" | (string & {})) {
    switch (newValue) {
      case "import":
        void navigate(`/import-wallet${location.search}`);
        break;

      case "generate": {
        const newAccount = await Vault.spawn();
        addAccount(newAccount);
        setCurrentAddress(newAccount.address);
        void navigate(`/wallets/${newAccount.address}${location.search}`);
        break;
      }

      default:
        setCurrentAddress(newValue);
        void navigate(`/wallets/${newValue}${location.search}`);
    }
  }

  return (
    <div className="flex justify-between bg-[#5271FF] p-2">
      <div className="flex justify-start gap-4">
        <img src="/jstz_icon.png" alt="jstz" className="size-10" />

        <h1 className="my-auto text-lg font-bold text-[#000000]">Jstz wallet</h1>
      </div>

      {Object.keys(accounts).length > 0 && (
        <Select value={accountAddress} onValueChange={handleOnSelect}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {Object.entries(accounts).map(([address], i) => (
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
