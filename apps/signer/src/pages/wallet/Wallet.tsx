import { useSuspenseQuery } from "@tanstack/react-query";

import { Alert, AlertDescription } from "jstz-ui/ui/alert";
import { Button } from "jstz-ui/ui/button";
import { Label } from "jstz-ui/ui/label";
import { Skeleton } from "jstz-ui/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "jstz-ui/ui/tooltip";
import { cn } from "jstz-ui/utils";
import { Eye, EyeOff } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Suspense, useState } from "react";
import { redirect, useParams, type LoaderFunctionArgs } from "react-router";
import SuperJSON from "superjson";
import { z } from "zod/v4-mini";
import { AccountSelect } from "~/components/AccountSelect";
import {
  CopyContainer,
  copyContainerVariants,
  descriptionVariants,
} from "~/components/CopySection";
import { NetworkSelect } from "~/components/NetworkSelect";
import { $fetch } from "~/lib/$fetch";
import { useWindowContext } from "~/lib/Window.context.tsx";
import { StorageKeys, type KeyStorage } from "~/lib/constants/storage";
import { toTezString } from "~/lib/currency.utils.ts";
import { createOperation, sign } from "~/lib/jstz";
import { usePasskeyWallet } from "~/lib/passkeys/usePasskeyWallet";
import { useVault } from "~/lib/vaultStore";
import {
  RequestEventTypes,
  ResponseEventTypes,
  type SignOperationContent,
} from "~/scripts/service-worker";
import { walletParsers } from "./url-params";

export function loader({ params }: LoaderFunctionArgs) {
  const { accountAddress } = params;

  if (!accountAddress) {
    return redirect(`/add-wallet${location.search}`);
  }

  const account = useVault.getState().accounts[accountAddress];

  if (!account) {
    return redirect(`/add-wallet${location.search}`);
  }
}

export default function Wallet() {
  const { accountAddress } = useParams() as { accountAddress: string };

  const [{ content, isPopup, flow }] = useQueryStates(walletParsers);

  const parsedContent = SuperJSON.parse<SignOperationContent>(content);

  const { currentNetwork, accounts } = useVault((state) => state);
  const account = accounts[accountAddress];

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-col gap-2">
          <Label>Network</Label>
          <NetworkSelect />
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label>Account</Label>
              <AccountSelect selectedAccount={accountAddress} />
            </div>

            <div className="col-span-1 space-y-2">
              <Label>Balance</Label>

              <Suspense fallback={<BalanceFallback />}>
                <Balance address={accountAddress} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Address:</Label>
        <CopyContainer>{accountAddress}</CopyContainer>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Public key:</Label>
        <CopyContainer>{account?.[StorageKeys.PUBLIC_KEY] ?? ""}</CopyContainer>
      </div>

      {account?.[StorageKeys.PRIVATE_KEY] !== null && (
        <div className="flex w-full flex-col gap-2">
          <Label className="uppercase text-white/50">Private key:</Label>

          <CopyContainer
            variant="secondary"
            text={account?.[StorageKeys.PRIVATE_KEY] ?? ""}
            renderAdditionalButton={(props) => (
              <Button
                {...props}
                onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
                renderIcon={(props) =>
                  privateKeyVisible ? <EyeOff size={20} {...props} /> : <Eye size={20} {...props} />
                }
              />
            )}
          >
            {privateKeyVisible && account?.[StorageKeys.PRIVATE_KEY]
              ? account[StorageKeys.PRIVATE_KEY]
              : "•".repeat(32)}
          </CopyContainer>
        </div>
      )}

      {isPopup &&
        (() => {
          switch (flow) {
            case RequestEventTypes.SIGN:
              if (!account) return null;

              return (
                <OperationSigningDialog
                  networkUrl={currentNetwork}
                  accountAddress={accountAddress}
                  account={account}
                  content={parsedContent}
                />
              );

            case RequestEventTypes.GET_ADDRESS:
              return <GetAddressDialog currentAddress={accountAddress} />;

            default:
              return null;
          }
        })()}
    </div>
  );
}

interface OperationSigningDialogProps {
  account: KeyStorage;
  accountAddress: string;
  networkUrl?: string;
  content: SignOperationContent;
}

function OperationSigningDialog({
  account,
  accountAddress,
  networkUrl,
  content,
}: OperationSigningDialogProps) {
  const { close } = useWindowContext();

  const wallet = usePasskeyWallet();

  async function handleConfirm() {
    const operation = await createOperation({
      content,
      address: accountAddress,
      publicKey: account[StorageKeys.PUBLIC_KEY],
      baseURL: networkUrl,
    });

    // If `secretKey` exists that means that it's a normal non-passkey account
    const secretKey = account[StorageKeys.PRIVATE_KEY];

    let signature;
    let verifier = null;
    if (secretKey) {
      signature = sign(operation, secretKey);
    } else {
      const {
        signature: passKeySignature,
        authenticatorData,
        clientDataJSON,
      } = await wallet.current.passkeySign(operation);

      signature = passKeySignature;

      verifier = {
        Passkey: {
          authenticatorData,
          clientDataJSON,
        },
      };
    }

    await chrome.runtime.sendMessage({
      type: ResponseEventTypes.PROCESS_QUEUE,
      data: {
        signature,
        operation,
        verifier,
      },
    });

    close();
  }

  async function handleReject() {
    await chrome.runtime.sendMessage({ type: ResponseEventTypes.DECLINE });
    close();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg">Do you want to sign the operation with the current address?</h1>

      <div className="flex w-full justify-end gap-4">
        <Button variant="outline" onClick={handleReject}>
          Cancel
        </Button>

        <Button onClick={handleConfirm}>Sign</Button>
      </div>
    </div>
  );
}

function GetAddressDialog({ currentAddress }: { currentAddress: string }) {
  const { close } = useWindowContext();

  async function handleGetAddress() {
    await chrome.runtime.sendMessage({
      type: ResponseEventTypes.GET_ADDRESS_RESPONSE,
      data: { accountAddress: currentAddress },
    });
    close();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg">Pass the address to log in.</h1>

      <div className="flex w-full justify-end gap-4">
        <Button onClick={handleGetAddress}>Get address</Button>
      </div>
    </div>
  );
}

interface BalanceProps {
  address: string;
}

function Balance({ address }: BalanceProps) {
  const currentNetwork = useVault.use.currentNetwork();

  const {
    data: { data: balance, error },
  } = useSuspenseQuery({
    queryKey: ["balance", address, currentNetwork],
    queryFn: () =>
      $fetch(`${currentNetwork}/accounts/${address}/balance`, {
        output: z.number(),
      }),
  });

  return (
    <Alert className={cn(copyContainerVariants({ variant: "secondary" }))}>
      <Tooltip>
        <TooltipTrigger>
          <AlertDescription
            className={cn(
              descriptionVariants({
                variant: "secondary",
              }),
              "h-8 items-center justify-center",
            )}
          >
            <p className="max-w-24 truncate">{!error ? toTezString(balance) : "n/a"}</p>
          </AlertDescription>
        </TooltipTrigger>
        <TooltipContent>
          <p>{toTezString(balance)}</p>
        </TooltipContent>
      </Tooltip>
    </Alert>
  );
}

function BalanceFallback() {
  return <Skeleton className="h-[38.75px]" />;
}
