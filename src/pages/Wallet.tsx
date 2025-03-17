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
    <div className="flex flex-col px-2">
      <h1 className="my-2 font-semibold">address: {accountAddress}</h1>

      <p>private key: {data?.[StorageKeys.ACCOUNT_PRIVATE_KEY]}</p>
      <p>public key: {data?.[StorageKeys.ACCOUNT_PUBLIC_KEY]}</p>
    </div>
  );
}
