import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { WalletType } from "~/lib/vault";

type ImportWalletFormProps = {
  onSubmit: (form: WalletType) => void;
};

export function ImportWalletForm({ onSubmit }: ImportWalletFormProps) {
  const [address, setAddress] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  return (
    <div>
      <form className="flex w-full max-w-96 flex-col gap-4">
        <div className="space-y-2">
          <Label>Jstz account address:</Label>
          <Input
            type="text"
            value={address}
            required
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Public key:</Label>
          <Input
            type="text"
            value={publicKey}
            required
            onChange={(e) => setPublicKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Secret key:</Label>
          <Input
            type="text"
            value={privateKey}
            required
            onChange={(e) => setPrivateKey(e.target.value)}
          />
        </div>

        <div className={"flex justify-end"}>
          <Button
            disabled={!address || !publicKey || !privateKey}
            type="button"
            variant={"jstz"}
            onClick={() => onSubmit({ address, publicKey, privateKey })}
          >
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
