import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
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
      setCurrentNetwork(presetNetworks[0] || "");
    } catch (error) {
      console.error("Failed to remove custom network:", error);
    }
  }

  return (
    <Select value={currentNetwork} onValueChange={handleOnSelect}>
      <SelectTrigger>
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
            <SelectItem value={url} key={url} >
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
        <div className="relative ">
          {!!networkValue && (
            <Button
              className="absolute top-0.5 right-0.5"
              variant="link"
              onClick={handleAddCustomNetwork}
            >
              <ChevronRight />
            </Button>
          )}
          <Input className="pr-8" onChange={(e) => setNetworkValue(e.target.value)} value={networkValue} />
        </div>
      </SelectContent>
    </Select>
  );
}
