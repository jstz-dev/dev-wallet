import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";
import { shortenAddress } from "~/lib/utils.ts";

import { getPublicKey, seedToHDPrivateKey } from "./misc";

export interface WalletType {
  name: string;
  address: string;
  publicKey: string;
  privateKey: string;
}

export async function getPublicKeyFromPrivateKey(privateKey: string): Promise<string> {
  // Assuming getPublicKey is a function that retrieves the public key from the private key
  return getPublicKey(privateKey);
}

export async function getAddressAndPublicKey(
  privateKey: string,
): Promise<{ address: string; publicKey: string }> {
  const publicKey = await getPublicKey(privateKey);
  const address = TaquitoUtils.getPkhfromPk(publicKey);

  return { address, publicKey };
}

/**
 * Creates a new wallet.
 *
 * @param mnemonic Seed phrase
 * @returns Generated wallet
 */
export async function spawn(mnemonic?: string): Promise<WalletType> {
  if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, 0);
  const { address, publicKey } = await getAddressAndPublicKey(privateKey);

  return {
    name: shortenAddress(address),
    address,
    publicKey,
    privateKey,
  };
}
