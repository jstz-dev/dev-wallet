import Jstz from "@jstz-dev/jstz-client";
import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";
import * as signer from "jstz_sdk";
import type { QueuedSignRequest } from "~/scripts/service-worker";
import { PasskeyWallet } from "./passkeys/PasskeyWallet";
import { userStore } from "./passkeys/userStore";
import type { WalletType } from "./vault";

export function sign(operation: Jstz.Operation, secretKey: string) {
  return signer.sign_operation(operation, secretKey);
}

/**
 * @throws {RangeError} When there's no credential with the `res.id`
 * @throws {Error} When `SimpleWebAuthnServer.verifyAuthenticationResponse` fails
 */
export async function passkeySign(operation: Jstz.Operation) {
  const wallet = new PasskeyWallet(
    userStore,
    "localhost",
    [`chrome-extension://${chrome.runtime.id}`],
    60_000,
  );

  const opts = await wallet.generateAuthenticationOptions(operation);
  const resp = await SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: opts });

  return wallet.verifyAuthentication(resp);
}

export async function createOperation({
  content,
  address,
  publicKey,
  baseURL,
}: {
  content: QueuedSignRequest["content"];
  address: WalletType["address"];
  publicKey: string;
  baseURL?: string;
}): Promise<Jstz.Operation> {
  const jstzClient = new Jstz({
    baseURL,
    timeout: 6000,
  });

  const nonce = await jstzClient.accounts.getNonce(address).catch(() => Promise.resolve(0));

  return {
    content,
    nonce,
    publicKey,
  };
}
