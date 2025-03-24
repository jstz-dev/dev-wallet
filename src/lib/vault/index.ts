import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";

import { getPublicKey, seedToHDPrivateKey } from "./misc";

export type WalletType = {
  address: string;
  publicKey: string;
  privateKey: string;
};

/**
 * Creates a new wallet.
 * @param mnemonic Seed phrase
 * @returns Generated wallet
 */
export async function spawn(mnemonic?: string): Promise<WalletType> {
  if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, 0);
  const publicKey = await getPublicKey(privateKey);
  const accountAddress = TaquitoUtils.getPkhfromPk(publicKey);

  return { address: accountAddress, publicKey, privateKey };
}
