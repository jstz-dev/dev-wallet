import { Button } from "jstz-ui/ui/button";
import { usePasskeyWallet } from "~/lib/passkeys/usePasskeyWallet";
import { useVault } from "~/lib/vaultStore";

export default function CreatePasskey() {
  const wallet = usePasskeyWallet();

  const { addAccount } = useVault();

  return (
    <div>
      <h1>Create Passkey</h1>

      <Button>Create passkey</Button>
    </div>
  );
}
