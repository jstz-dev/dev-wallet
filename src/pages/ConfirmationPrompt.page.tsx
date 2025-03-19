import { Button } from "~/components/ui/button";
import { useWallet } from "~/lib/hooks/useWallet";
import { WalletRequestEnum } from "~/scripts/service-worker";

export default function ConfirmationPrompt() {
  const wallet = useWallet();

  async function handleConfirm() {
    await chrome.runtime.sendMessage({
      type: WalletRequestEnum.PROCESS_QUEUE,
      data: wallet.accounts[wallet.currentAddress],
    });

    window.close();
  }

  async function handleReject() {
    await chrome.runtime.sendMessage({ type: WalletRequestEnum.SIGN_DECLINE });
    window.close();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-between p-4">
      <h1 className="text-lg">You're about to sign an operation. Do you want to procceed?</h1>

      <div className="flex w-full justify-center gap-4">
        <Button variant="destructive" onClick={handleReject}>
          No
        </Button>

        <Button onClick={handleConfirm}>Yes</Button>
      </div>
    </div>
  );
}
