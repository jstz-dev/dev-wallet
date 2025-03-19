import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";

import { StorageKeys, type Accounts } from "../constants/storage";
import { getPublicKey, seedToHDPrivateKey } from "./misc";

export type WalletType = {
  address: string;
  publicKey: string;
  privateKey: string;
};

/**
 * Creates a new wallet and saves it.
 * @param mnemonic Seed phrase
 * @returns Generated key pair
 */
export async function spawnAndSave(mnemonic?: string) {
  const { address, publicKey, privateKey } = await spawn(mnemonic);

  await addAccountToStorage({ address, publicKey, privateKey });

  return { address, publicKey, privateKey };
}

/**
 * Creates a new wallet.
 * @param mnemonic Seed phrase
 * @returns Generated wallet
 */
async function spawn(mnemonic?: string): Promise<WalletType> {
  if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const privateKey = seedToHDPrivateKey(seed, 0);
  const publicKey = await getPublicKey(privateKey);
  const accountAddress = TaquitoUtils.getPkhfromPk(publicKey);

  return { address: accountAddress, publicKey, privateKey };
}

export async function addAccountToStorage({ address, publicKey, privateKey }: WalletType) {
  const accounts = await getAccounts();

  accounts[address] = {
    [StorageKeys.PUBLIC_KEY]: publicKey,
    [StorageKeys.PRIVATE_KEY]: privateKey,
  };

  return chrome.storage.local.set({ accounts });
}

export async function getAccounts(): Promise<Accounts> {
  let { accounts } = await chrome.storage.local.get<{ accounts: Accounts | null }>(
    StorageKeys.ACCOUNTS,
  );

  if (!accounts) {
    void chrome.storage.local.set({ accounts: {} });
    accounts = {};
  }

  return accounts;
}
