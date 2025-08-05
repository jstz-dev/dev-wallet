import { Button } from "jstz-ui/ui/button";
import { Input } from "jstz-ui/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "jstz-ui/ui/select";
import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { useVault } from "~/lib/vaultStore.ts";

const presetNetworksString = (import.meta.env.VITE_JSTZ_NETWORKS || "") as string;

export function NetworkSelect() {
  const presetNetworks = presetNetworksString.split(", ").map((n) => n.trim());

  const { customNetworks, setCurrentNetwork, currentNetwork, setCustomNetworks } = useVault(
    (state) => state,
  );

  const [networkValue, setNetworkValue] = useState("");

  function handleOnSelect(newValue: string) {
    setCurrentNetwork(newValue);
  }

  function handleAddCustomNetwork() {
    try {
      if (!customNetworks.includes(networkValue)) {
        const newList = [...customNetworks, networkValue];
        setCustomNetworks(newList);
        setNetworkValue("");
      }
    } catch (error) {
      console.error("Failed to add custom network:", error);
    }
  }

  function handleRemoveCustomNetwork(url: string) {
    try {
      const newList = customNetworks.filter((n) => n !== url);
      setCustomNetworks(newList);
      setCurrentNetwork(presetNetworks[presetNetworks.length - 1] || "");
    } catch (error) {
      console.error("Failed to remove custom network:", error);
    }
  }

  return (
    <Select value={currentNetwork} onValueChange={handleOnSelect}>
      <SelectTrigger className="dark:hover:bg-black-600 hover:bg-black-600 bg-black-800 dark:bg-black-800 rounded-md border-0">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {presetNetworks.map((url) => (
          <SelectItem value={url} key={url}>
            {url}
          </SelectItem>
        ))}

        {!!customNetworks.length && <SelectSeparator />}

        {customNetworks.map((url) => (
          <div key={url} className="flex items-center gap-2 px-1">
            <SelectItem value={url} key={url}>
              {url}
            </SelectItem>

            <X
              size={16}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCustomNetwork(url);
              }}
            />
          </div>
        ))}

        <SelectSeparator />

        <div className="relative">
          {!!networkValue && (
            <Button
              className="absolute right-0.5 top-0.5"
              variant="link"
              onClick={handleAddCustomNetwork}
            >
              <ChevronRight />
            </Button>
          )}

          <Input
            className="pr-8"
            onChange={(e) => setNetworkValue(e.target.value)}
            value={networkValue}
          />
        </div>
      </SelectContent>
    </Select>
  );
}
