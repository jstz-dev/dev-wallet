import type { RegistrationResponseJSON } from "@simplewebauthn/browser";
import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";
import * as TaquitoUtils from "@taquito/utils";
import { Button, buttonVariants } from "jstz-ui/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { parseKey } from "passkey-signer";
import { usePasskeyWallet } from "passkey-signer-react";
import { Link, redirect, useLocation, useNavigate, type LoaderFunctionArgs } from "react-router";
import { AccountSelect } from "~/components/AccountSelect";
import { StorageKeys } from "~/lib/constants/storage";
import * as Vault from "~/lib/vault";
import { useVault, vault } from "~/lib/vaultStore";
import { loadHomeParams } from "./url-params";

export function loader({ request }: LoaderFunctionArgs) {
  const currentAddress = vault.getState().currentAddress;
  const searchParams = new URL(request.url).searchParams;
  const { path } = loadHomeParams(searchParams);

  if (path) {
    searchParams.delete("path");

    return redirect(`${path}?${searchParams}`);
  }

  if (currentAddress) return redirect(`/wallets/${currentAddress}?${searchParams}`);
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentAddress = useVault.use.currentAddress();
  const setCurrentAddress = useVault.use.setCurrentAddress();
  const addAccount = useVault.use.addAccount();

  async function handleGenerate() {
    const account = await Vault.spawn();

    addAccount(account);
    setCurrentAddress(account.address);
    goToWallet(account.address);
  }

  function goToWallet(address: string) {
    void navigate(`/wallets/${address}${location.search}`);
  }

  const isPasskeysAvailable = SimpleWebAuthnBrowser.browserSupportsWebAuthn();

  function onSuccess(publicKey: string) {
    const address = TaquitoUtils.getPkhfromPk(publicKey);

    const accounts = useVault.getState().accounts;

    const numberOfPasskeyAccounts = Object.values(accounts).filter(
      (account) => account[StorageKeys.PRIVATE_KEY] === null,
    ).length;

    addAccount({
      publicKey,
      address,
      name: `passkey-${numberOfPasskeyAccounts + 1}`,
      privateKey: null,
    });

    setCurrentAddress(address);

    goToWallet(address);
  }

  return (
    <div className="flex flex-col justify-center gap-8 p-4">
      <div className="flex flex-col items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2">
          {!!currentAddress && (
            <Button onClick={() => goToWallet(currentAddress)} variant="link">
              <ArrowLeft />
            </Button>
          )}

          <div className="flex-1">
            <AccountSelect selectedAccount={currentAddress} canAddWallet={false} />
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full rounded-md capitalize"
          onClick={handleGenerate}
        >
          Create wallet
        </Button>

        {isPasskeysAvailable && <RegisterPasskey onSuccess={onSuccess} />}

        <Link
          to={`/import-wallet${location.search}`}
          className={buttonVariants({
            variant: "ghost",
            className: "bg-black-600 w-full rounded-md capitalize hover:bg-white/10",
          })}
        >
          Import wallet
        </Link>
      </div>
    </div>
  );
}

interface RegisterPasskeyProps {
  onSuccess?: (publicKey: string) => void;
}

function RegisterPasskey({ onSuccess }: RegisterPasskeyProps) {
  const { wallet } = usePasskeyWallet();

  const isPopup = (() => {
    const views = chrome.extension.getViews({ type: "popup" });
    return views.includes(window);
  })();

  function openOptionsPage() {
    const params = new URLSearchParams({
      path: "/add-wallet",
    });

    void chrome.windows.create({
      url: `index.html?${params}`,
      type: "popup",
      focused: true,
      width: 450,
      height: 720,
      // incognito, top, left, ...
    });
  }

  async function handleCreatePasskeyWallet() {
    let attResp: RegistrationResponseJSON;
    try {
      const opts = await wallet.generateRegistrationOptions();

      attResp = await SimpleWebAuthnBrowser.startRegistration({ optionsJSON: opts });
    } catch (err) {
      console.error(err);
      return;
    }

    const { verified, publicKey } = await wallet.verifyRegistration(attResp);

    if (verified) {
      console.info(`Authenticator registered!`);

      const decodedKey = await parseKey(publicKey);
      if (decodedKey) onSuccess?.(decodedKey);
    } else {
      console.error(`Oh no, something went wrong! Response: ${verified}`);
    }
  }

  return (
    <Button
      variant="secondary"
      className="w-full rounded-md capitalize"
      onClick={isPopup ? openOptionsPage : handleCreatePasskeyWallet}
      renderIcon={() => isPopup && <ExternalLink />}
      iconPosition="right"
    >
      Create passkey wallet
    </Button>
  );
}
