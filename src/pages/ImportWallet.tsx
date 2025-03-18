import { useNavigate } from "react-router";
import {addAccountToStorage, type WalletType} from "~/lib/vault";
import {ImportWalletForm} from "~/components/ImportWallet.form.tsx";

interface ImportWalletProps {
    onGenerate?: (payload: WalletType) => void | Promise<void>;
}

export default function ImportWallet({onGenerate}: ImportWalletProps) {
  const navigate = useNavigate();

    async function onImportWalletSubmit(form: {
        address: string;
        publicKey: string;
        privateKey: string;
    }) {
        await addAccountToStorage(form);
        goToWallet(form.address);
        onGenerate?.(form);
    }

    function goToWallet(address: string) {
        navigate(`/wallets/${address}`);
    }

  return (
    <div className="flex flex-col px-2 gap-2">
        <h3 className={'text-lg font-bold'}>Provide details of wallet to import</h3>
        <ImportWalletForm onSubmit={onImportWalletSubmit} />
    </div>
  );
}
