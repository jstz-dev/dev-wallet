import { useState } from "react";
import { Button } from "~/components/ui/button";
import {Label} from "~/components/ui/label";
import {Input} from "~/components/ui/input";

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
      <form className="fields space-y-4 max-w-96" >
        <div className={"space-y-2"}>
          <Label>Jstz account address:</Label>
          <Input
            type="text"
            value={accountAddress}
            required
            onChange={(e) => setAccountAddress(e.target.value)}
          ></Input>
        </div>
        <div className={"space-y-2"}>

        <Label>Public key:</Label>
          <Input
            type="text"
            value={publicKey}
            required
            onChange={(e) => setPublicKey(e.target.value)}
          ></Input>
        </div>
        <div className={"space-y-2"}>

          <Label>Secret key:</Label>
          <Input
            type="text"
            value={privateKey}
            required
            onChange={(e) => setPrivateKey(e.target.value)}
          ></Input>
        </div>

        <Button disabled={!accountAddress || !publicKey || !privateKey} type="button" onClick={() => onSubmit({ accountAddress, publicKey, privateKey })}>
          Add
        </Button>
      </form>
    </div>
  );
}
