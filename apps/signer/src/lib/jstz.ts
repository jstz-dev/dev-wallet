import Jstz from "@jstz-dev/jstz-client";
import * as signer from "jstz_sdk";
import type { SignOperationContent } from "~/scripts/service-worker";
import type { WalletType } from "./vault";

export function sign(operation: Jstz.Operation, secretKey: string) {
  return signer.sign_operation(operation, secretKey);
}

export async function createOperation({
  content,
  address,
  publicKey,
  baseURL,
}: {
  content: SignOperationContent;
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
