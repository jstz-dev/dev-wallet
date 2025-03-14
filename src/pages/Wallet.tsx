import { useNavigate, useParams } from "react-router";
import type { KeyStorage } from "~/lib/constants/storage";
import { useStorageLocal } from "~/lib/hooks/useStorageLocal";

export default function Wallet() {
  const { address } = useParams() as { address: string };
  const navigate = useNavigate();

  const { data } = useStorageLocal<Record<string, KeyStorage>, KeyStorage>("address", {
    select: (data) => {
      const currentAddress = data[address];
      if (!!currentAddress) navigate("/");

      return currentAddress!;
    },
  });

  return (
    <div>
      <h1>{address}</h1>
      <p>{JSON.stringify(data)}</p>
    </div>
  );
}
