import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { StorageKeys } from "~/lib/constants/storage";
import { useVault } from "~/lib/vaultStore";
import { WalletRequestTypes } from "~/scripts/service-worker";

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
    <div className="flex flex-col gap-4 p-2">
      <h1>
        <span className="font-bold">Address:</span> {accountAddress}
      </h1>

      <div>
        <p>
          <span className="font-bold">Private Key:</span> {account?.[StorageKeys.PRIVATE_KEY]}
        </p>

        <p>
          <span className="font-bold">Public Key:</span> {account?.[StorageKeys.PUBLIC_KEY]}
        </p>
      </div>

      {isPopup && (
        <div className="flex min-h-full flex-col items-center justify-between p-4">
          <h1 className="text-lg">
            You&apos;re about to sign an operation. Do you want to proceed?
          </h1>

          <div className="flex w-full justify-center gap-4">
            <Button variant="destructive" onClick={handleReject}>
              No
            </Button>

            <Button onClick={handleConfirm}>Yes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
