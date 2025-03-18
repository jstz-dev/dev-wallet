import { useNavigate, useParams } from "react-router";
import { StorageKeys, type Accounts, type KeyStorage } from "~/lib/constants/storage";
import { useStorageLocal } from "~/lib/hooks/useStorageLocal";

export default function Wallet() {
  const { accountAddress } = useParams() as { accountAddress: string };
  const navigate = useNavigate();

  const { data } = useStorageLocal<Accounts, KeyStorage | undefined>(StorageKeys.ACCOUNTS, {
    select: (data) => {
      const currentAddress = data[accountAddress];
      if (!currentAddress) navigate("/404");

      return currentAddress;
    },
  });

  return (
    <div className="flex flex-col gap-4 p-2">
      <h1>
        <span className="font-bold">Address:</span> {accountAddress}
      </h1>

      <div>
        <p>
          <span className="font-bold">Private Key:</span> {data?.[StorageKeys.PRIVATE_KEY]}
        </p>

        <p>
          <span className="font-bold">Public Key:</span> {data?.[StorageKeys.PUBLIC_KEY]}
        </p>
      </div>
    </div>
  );
}
