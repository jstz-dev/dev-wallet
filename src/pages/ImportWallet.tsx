import { useNavigate } from "react-router";
import {addAccountToStorage} from "~/lib/vault";
import {ImportWalletForm} from "~/components/ImportWallet.form.tsx";

export default function ImportWallet() {
  const navigate = useNavigate();

    async function onImportWalletSubmit(form: {
        accountAddress: string;
        publicKey: string;
        privateKey: string;
    }) {
        console.log(form);
        await addAccountToStorage(form);
        goToWallet(form.accountAddress);
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
