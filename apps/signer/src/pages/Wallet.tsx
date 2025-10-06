import { useSuspenseQuery } from "@tanstack/react-query";

import { Alert, AlertDescription } from "jstz-ui/ui/alert";
import { Button } from "jstz-ui/ui/button";
import { Label } from "jstz-ui/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "jstz-ui/ui/select";
import { Skeleton } from "jstz-ui/ui/skeleton";
import { Eye, EyeOff } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { AccountSelect } from "~/components/AccountSelect";
import {
  CopyContainer,
  copyContainerVariants,
  descriptionVariants,
} from "~/components/CopySection";
import { NetworkSelect } from "~/components/NetworkSelect";
import { $fetch } from "~/lib/$fetch";
import { useWindowContext } from "~/lib/Window.context.tsx";
import { HTTPStatus } from "~/lib/constants/HTTPCodes";
import { StorageKeys, type KeyStorage } from "~/lib/constants/storage";
import { shortenAddress } from "~/lib/utils.ts";
import { useVault } from "~/lib/vaultStore";
import { RequestEventTypes, ResponseEventTypes } from "~/scripts/service-worker";

export default function Wallet() {
  const { accountAddress } = useParams() as { accountAddress: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPopup = searchParams.get("isPopup") === "true";

  const { accounts, currentNetwork } = useVault((state) => state);
  const account = accounts[accountAddress];

  useEffect(() => {
    if (!account) void navigate(`/add-wallet${location.search}`, { replace: true });
  }, [account, navigate]);

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="flex w-full gap-2">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col gap-2">
            <Label>Network</Label>
            <NetworkSelect />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Account</Label>
            <AccountSelect selectedAccount={accountAddress} />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Balance:</Label>

        <Suspense fallback={<BalanceFallback />}>
          <Balance address={accountAddress} />
        </Suspense>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Name:</Label>
        <CopyContainer variant="secondary">{shortenAddress(accountAddress)}</CopyContainer>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Address:</Label>
        <CopyContainer>{accountAddress}</CopyContainer>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label className="uppercase text-white/50">Public key:</Label>
        <CopyContainer>{account?.[StorageKeys.PUBLIC_KEY] ?? ""}</CopyContainer>
      </div>

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

      {isPopup &&
        (() => {
          switch (searchParams.get("flow")) {
            case RequestEventTypes.SIGN:
              return (
                <OperationSigningDialog
                  networkUrl={currentNetwork}
                  accountAddress={accountAddress}
                  account={account}
                />
              );

            case RequestEventTypes.GET_ADDRESS:
              return <GetAddressDialog currentAddress={accountAddress} />;

            default:
              return <></>;
          }
        })()}
    </div>
  );
}

function OperationSigningDialog({
  account,
  accountAddress,
  networkUrl,
}: {
  account?: KeyStorage;
  accountAddress: string;
  networkUrl?: string;
}) {
  const { close } = useWindowContext();
  async function handleConfirm() {
    await chrome.runtime.sendMessage({
      type: ResponseEventTypes.PROCESS_QUEUE,
      data: {
        address: accountAddress,
        privateKey: account?.[StorageKeys.PRIVATE_KEY],
        publicKey: account?.[StorageKeys.PUBLIC_KEY],
        networkUrl,
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
    queryKey: ["balance", address],
    queryFn: () => $fetch<number>(`${currentNetwork}/accounts/${address}/balance`),
  });

  if (error?.status === HTTPStatus.NotFound) {
    return (
      <Alert variant="warning" className="group relative border-0 p-2">
        <AlertDescription>
          <p className="max-w-[36ch]">
            We couldn&apos;t find balance for your wallet. It&apos;s probably unrevealed.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={copyContainerVariants({ variant: "secondary" })}>
      <AlertDescription
        className={descriptionVariants({
          variant: "secondary",
        })}
      >
        <p className="max-w-[36ch] truncate">{balance}</p>
      </AlertDescription>
    </Alert>
  );
}

function BalanceFallback() {
  return <Skeleton className="h-[38.75px]" />;
}
