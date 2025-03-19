import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type WalletType } from "~/lib/Wallet";

interface ImportWalletFormProps {
  onSubmit: (form: WalletType) => void;
}

export function ImportWalletForm({ onSubmit }: ImportWalletFormProps) {
  const [address, setAddress] = useState("tz1NCmDSFAiAs7y8K6FFaa6U5717LbbinG3E");
  const [publicKey, setPublicKey] = useState(
    "edpkuKwgNv6LycVpNiMsqbDgvFkeLoaXD5tMkEwyoeUsY8MvD4yQrN",
  );
  const [privateKey, setPrivateKey] = useState(
    "edsk3Q1dYQCiBNvXSYHSw56wBSi6PnsZkqdsqHsxTff9ZA1GhLNo1Z",
  );

  return (
    <div>
      <form className="fields max-w-96 space-y-4">
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

        <Button
          disabled={!address || !publicKey || !privateKey}
          type="button"
          onClick={() => onSubmit({ address, publicKey, privateKey })}
        >
          Add
        </Button>
      </form>
    </div>
  );
}
