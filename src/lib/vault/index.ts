import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";

import { StorageKeys, type KeyStorage } from "../constants/storage";
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
  const accountAddress = TaquitoUtils.getPkhfromPk(publicKey);

  const accounts = await getAccounts();

  accounts[accountAddress] = {
    [StorageKeys.ACCOUNT_PUBLIC_KEY]: publicKey,
    [StorageKeys.ACCOUNT_PRIVATE_KEY]: privateKey,
  };

  void chrome.storage.local.set({ accounts });

  return { address: accountAddress, publicKey, privateKey };
}

async function getAccounts(): Promise<Record<string, KeyStorage>> {
  let { accounts } = await chrome.storage.local.get("accounts");
  if (!accounts) {
    chrome.storage.local.set({ accounts: {} });
    accounts = {};
  }

  return accounts;
}
