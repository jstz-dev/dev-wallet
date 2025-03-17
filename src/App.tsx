import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { StorageKeys, type KeyStorage } from "~/lib/constants/storage";
import { useStorageLocal } from "~/lib/hooks/useStorageLocal";
import { cn } from "~/lib/utils";
import { spawn } from "~/lib/vault";

export default function App() {
  const { data, isLoading, refetch } = useStorageLocal<KeyStorage>([
    StorageKeys.ACCOUNT_PRIVATE_KEY,
    StorageKeys.ACCOUNT_PUBLIC_KEY,
  ]);

  async function generateKeys() {
    await spawn();
    void refetch();
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4",
        !data?.[StorageKeys.ACCOUNT_PRIVATE_KEY] ? "min-w-48" : "min-w-100",
      )}
    >
      <h1 className="text-4xl font-bold">Dev Wallet</h1>

      {isLoading && <Skeleton />}

      {!isLoading && !data?.[StorageKeys.ACCOUNT_PRIVATE_KEY] && (
        <Button onClick={generateKeys}>Generate</Button>
      )}

      {!isLoading && !!data?.[StorageKeys.ACCOUNT_PRIVATE_KEY] && (
        <div className="w-80">
          <p className="text-wrap">private key: {data?.[StorageKeys.ACCOUNT_PRIVATE_KEY]}</p>
          <p>public key: {data?.[StorageKeys.ACCOUNT_PUBLIC_KEY]}</p>
        </div>
      )}
    </div>
  );
}
