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

  await addAccountToStorage({ accountAddress, publicKey, privateKey });

  return { address: accountAddress, publicKey, privateKey };
}

export async function addAccountToStorage({
  accountAddress,
  publicKey,
  privateKey,
}: {
  accountAddress: string;
  publicKey: string;
  privateKey: string;
}) {
  const accounts = await getAccounts();

  accounts[accountAddress] = {
    [StorageKeys.ACCOUNT_PUBLIC_KEY]: publicKey,
    [StorageKeys.ACCOUNT_PRIVATE_KEY]: privateKey,
  };

  return chrome.storage.local.set({ accounts });
}

async function getAccounts(): Promise<Record<string, KeyStorage>> {
  let { accounts } = await chrome.storage.local.get("accounts");
  if (!accounts) {
    await chrome.storage.local.set({ accounts: {} });
    accounts = {};
  }

  return accounts;
}
