import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label.tsx";
import { StorageKeys, type KeyStorage } from "~/lib/constants/storage";
import { useVault } from "~/lib/vaultStore";
import { WalletEventTypes } from "~/scripts/service-worker";

export default function Wallet() {
  const { accountAddress } = useParams() as { accountAddress: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPopup = searchParams.get("isPopup") === "true";

  const { accounts } = useVault((state) => state);
  const account = accounts[accountAddress];

  useEffect(() => {
    if (!account) void navigate("/404");
  }, [account, navigate]);

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <h3 className="text-2xl font-bold">Your current wallet details</h3>

      <div className="flex w-full flex-col gap-2">
        <Label className="font-bold">Address</Label>
        {accountAddress}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="font-bold">Public Key</Label>
        {account?.[StorageKeys.PRIVATE_KEY]}
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap gap-2 align-middle">
          <Label className="font-bold">Private Key</Label>

          <div className="cursor-pointer" onClick={() => setPrivateKeyVisible(!privateKeyVisible)}>
            {privateKeyVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>

        <div>
          {privateKeyVisible ? account?.[StorageKeys.PUBLIC_KEY] : "*****************************"}
        </div>
      </div>

      {isPopup &&
        (() => {
          switch (searchParams.get("flow")) {
            case "sign":
              return <OperationSignageDialog accountAddress={accountAddress} account={account} />;

            case "getAddress":
              return <GetAddressDialog currentAddress={accountAddress} />;

            default:
              return <></>;
          }
        })()}
    </div>
  );
}

function OperationSignageDialog({
  account,
  accountAddress,
}: {
  account?: KeyStorage;
  accountAddress: string;
}) {
  async function handleConfirm() {
    await chrome.runtime.sendMessage({
      type: WalletEventTypes.PROCESS_QUEUE,
      data: {
        address: accountAddress,
        privateKey: account?.[StorageKeys.PRIVATE_KEY],
        publicKey: account?.[StorageKeys.PUBLIC_KEY],
      },
    });

    window.close();
  }

  async function handleReject() {
    await chrome.runtime.sendMessage({ type: WalletEventTypes.DECLINE });
    window.close();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg">Do you want to sign operation with current wallet?</h1>

      <div className="flex w-full justify-end gap-4">
        <Button variant="outline" onClick={handleReject}>
          Cancel
        </Button>

        <Button onClick={handleConfirm} variant="jstz">
          Sign
        </Button>
      </div>
    </div>
  );
}

function GetAddressDialog({ currentAddress }: { currentAddress: string }) {
  async function handleGetAddress() {
    await chrome.runtime.sendMessage({
      type: WalletEventTypes.GET_ADDRESS_RESPONSE,
      data: { accountAddress: currentAddress },
    });
    window.close();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg">Pass the address to log in.</h1>

      <div className="flex w-full justify-end gap-4">
        <Button onClick={handleGetAddress} variant="jstz">
          Get address
        </Button>
      </div>
    </div>
  );
}
