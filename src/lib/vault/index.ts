import * as Bip39 from "bip39";

import { StorageKeys } from "../constants/storage";
import { getPublicKey, seedToHDPrivateKey } from "./misc";

/**
 * Creates a new key pair and saves them.
 * @param mnemonic Seed phrase
 * @returns Generated key pair
 */
export async function spawn(mnemonic?: string) {
  if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, 0);
  const publicKey = await getPublicKey(privateKey);

  // TODO: Uncomment once we'll be adding support for accounts
  // const accountAddress = TaquitoUtils.getPkhfromPk(publicKey);

  void chrome.storage.local.set({
    [StorageKeys.ACCOUNT_PUBLIC_KEY]: publicKey,
    [StorageKeys.ACCOUNT_PRIVATE_KEY]: privateKey,
  });

  return [publicKey, privateKey];
}
