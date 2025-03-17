import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";

import { StorageKeys, type Accounts } from "../constants/storage";
import { getPublicKey, seedToHDPrivateKey } from "./misc";

/**
 * Creates a new wallet and saves it.
 * @param mnemonic Seed phrase
 * @returns Generated key pair
 */
export async function spawnAndSave(mnemonic?: string) {
  const { address, publicKey, privateKey } = await spawn(mnemonic);

  await addAccountToStorage({ accountAddress: address, publicKey, privateKey });

  return { address, publicKey, privateKey };
}

/**
 * Creates a new wallet.
 * @param mnemonic Seed phrase
 * @returns Generated wallet
 */
async function spawn(mnemonic?: string) {
  if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, 0);
  const publicKey = await getPublicKey(privateKey);
  const accountAddress = TaquitoUtils.getPkhfromPk(publicKey);

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

async function getAccounts(): Promise<Accounts> {
  let { accounts } = await chrome.storage.local.get(StorageKeys.ACCOUNTS);
  if (!accounts) {
    chrome.storage.local.set({ accounts: {} });
    accounts = {};
  }

  return accounts;
}
