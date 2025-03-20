import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label.tsx";
import { StorageKeys, type Accounts, type KeyStorage } from "~/lib/constants/storage";
import { useStorageLocal } from "~/lib/hooks/useStorageLocal";
import { WalletRequestTypes } from "~/scripts/service-worker";

export default function Wallet() {
  const { accountAddress } = useParams() as { accountAddress: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPopup = searchParams.get("isPopup") === "true";

  const { data: account } = useStorageLocal<Accounts, KeyStorage | undefined>(
    StorageKeys.ACCOUNTS,
    {
      select: (data) => {
        const currentAddress = data[accountAddress];
        if (!currentAddress) void navigate("/404");

        return currentAddress;
      },
    },
  );

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  async function handleConfirm() {
    await chrome.runtime.sendMessage({
      type: WalletRequestTypes.PROCESS_QUEUE,
      data: {
        address: accountAddress,
        privateKey: account?.[StorageKeys.PRIVATE_KEY],
        publicKey: account?.[StorageKeys.PUBLIC_KEY],
      },
    });

    window.close();
  }

  async function handleReject() {
    await chrome.runtime.sendMessage({ type: WalletRequestTypes.DECLINE });
    window.close();
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className={"font-2xl font-bold"}>Your current wallet details</div>
      <div className={"flex w-full flex-col gap-2"}>
        <Label className="font-bold">Address</Label>
        {accountAddress}
      </div>

      <div className={"flex w-full flex-col gap-2"}>
        <Label className="font-bold">Public Key</Label>
        {account?.[StorageKeys.PRIVATE_KEY]}
      </div>

      <div className={"flex w-full flex-col gap-2"}>
        <div className={"flex flex-wrap gap-2 align-middle"}>
          <Label className="font-bold">Private Key</Label>

          <div
            className={"cursor-pointer"}
            onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
          >
            {privateKeyVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>
        <div>
          {privateKeyVisible ? account?.[StorageKeys.PUBLIC_KEY] : "*****************************"}
        </div>
      </div>

      {isPopup && (
        <div className="flex flex-col gap-4">
          <h1 className="text-lg">Do you want to sign with current wallet?</h1>

          <div className="flex w-full gap-4">
            <Button variant="outline" onClick={handleReject}>
              Cancel
            </Button>

            <Button onClick={handleConfirm}>Sign</Button>
          </div>
        </div>
      )}
    </div>
  );
}
