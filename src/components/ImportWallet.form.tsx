import { useState } from "react";
import { Button } from "~/components/ui/button.tsx";

type ImportWalletFormProps = {
  onSubmit: (form: { accountAddress: string; publicKey: string; secretKey: string }) => void;
};

export function ImportWalletForm({ onSubmit }: ImportWalletFormProps) {
  const [accountAddress, setAccountAddress] = useState("tz1NCmDSFAiAs7y8K6FFaa6U5717LbbinG3E");
  const [publicKey, setPublicKey] = useState(
    "edpkuKwgNv6LycVpNiMsqbDgvFkeLoaXD5tMkEwyoeUsY8MvD4yQrN",
  );
  const [secretKey, setSecretKey] = useState(
    "edsk3Q1dYQCiBNvXSYHSw56wBSi6PnsZkqdsqHsxTff9ZA1GhLNo1Z",
  );

  return (
    <div>
      <form className="fields" onSubmit={() => onSubmit({ accountAddress, publicKey, secretKey })}>
        <div>
          <label>Jstz account address:</label>
          <input
            type="text"
            value={accountAddress}
            required
            onChange={(e) => setAccountAddress(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Public key:</label>
          <input
            type="text"
            value={publicKey}
            required
            onChange={(e) => setPublicKey(e.target.value)}
          ></input>
        </div>
        <div>
          <label>Secret key:</label>
          <input
            type="text"
            value={secretKey}
            required
            onChange={(e) => setSecretKey(e.target.value)}
          ></input>
        </div>

        <Button disabled={!accountAddress || !publicKey || !secretKey} type="submit">
          Add
        </Button>
      </form>
    </div>
  );
}
