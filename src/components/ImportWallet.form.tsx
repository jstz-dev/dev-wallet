import { useState } from "react";
import { Button } from "~/components/ui/button.tsx";

type ImportWalletFormProps = {
  onSubmit: (form: { accountAddress: string; publicKey: string; privateKey: string }) => void;
};

export function ImportWalletForm({ onSubmit }: ImportWalletFormProps) {
  const [accountAddress, setAccountAddress] = useState("tz1NCmDSFAiAs7y8K6FFaa6U5717LbbinG3E");
  const [publicKey, setPublicKey] = useState(
    "edpkuKwgNv6LycVpNiMsqbDgvFkeLoaXD5tMkEwyoeUsY8MvD4yQrN",
  );
  const [privateKey, setPrivateKey] = useState(
    "edsk3Q1dYQCiBNvXSYHSw56wBSi6PnsZkqdsqHsxTff9ZA1GhLNo1Z",
  );

  return (
    <div>
      <form className="fields" >
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
            value={privateKey}
            required
            onChange={(e) => setPrivateKey(e.target.value)}
          ></input>
        </div>

        <Button disabled={!accountAddress || !publicKey || !privateKey} type="button" onClick={() => onSubmit({ accountAddress, publicKey, privateKey })}>
          Add
        </Button>
      </form>
    </div>
  );
}
