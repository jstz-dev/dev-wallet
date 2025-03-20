import * as TaquitoUtils from "@taquito/utils";

import * as Bip39 from "bip39";
import * as signer from "jstz_sdk";

import { StorageKeys, type Accounts } from "./constants/storage";
import { getPublicKey, seedToHDPrivateKey } from "./vault";

export interface WalletType {
  address: string;
  publicKey: string;
  privateKey: string;
}

/**
 * An interface that allows interacting with the wallets and synchronizes them.
 */
export class Wallet {
  static #instance: Wallet;

  #accounts: Accounts = {};
  #currentAddress = "";

  #deconstructor = new FinalizationRegistry((_heldValue) => {
    chrome.storage.local.onChanged.removeListener(this.#storageListener);
  });

  private constructor() {
    chrome.storage.local
      .get<{
        [StorageKeys.ACCOUNTS]: Accounts;
        [StorageKeys.CURRENT_ADDRESS]: string;
      }>([StorageKeys.ACCOUNTS, StorageKeys.CURRENT_ADDRESS])
      .then(({ accounts, currentAddress }) => {
        this.#accounts = accounts;
        this.#currentAddress = currentAddress;
      });

    chrome.storage.local.onChanged.addListener(this.#storageListener);

    this.#deconstructor.register(this, Wallet.name);
  }

  public static get instance(): Wallet {
    if (!Wallet.#instance) {
      Wallet.#instance = new Wallet();
    }

    return Wallet.#instance;
  }

  /**
   * Sign an operation using the currently selected account.
   */
  public sign(privateKey: string, operation: Record<string, unknown>) {
    return signer.sign_operation(operation, privateKey!);
  }

  /**
   * Creates a new wallet.
   * @param mnemonic Seed phrase
   * @returns Generated wallet
   */
  async spawn(mnemonic?: string): Promise<WalletType> {
    if (!mnemonic) mnemonic = Bip39.generateMnemonic(128);

    const seed = Bip39.mnemonicToSeedSync(mnemonic);
    const privateKey = seedToHDPrivateKey(seed, 0);
    const publicKey = await getPublicKey(privateKey);
    const address = TaquitoUtils.getPkhfromPk(publicKey);

    this.addAccount({ address, publicKey, privateKey });

    return { address, publicKey, privateKey };
  }

  /**
   * Adds a new account to the `Wallet` and save it in the local store.
   * If there is already an account on the provided address it'll replace it.
   */
  public async addAccount({ address, privateKey, publicKey }: WalletType) {
    const accounts = await chrome.storage.local.get<Accounts>(StorageKeys.ACCOUNTS);

    accounts[address] = {
      privateKey,
      publicKey,
    };

    this.accounts = accounts;
  }

  /**
   * BUG: After clearing the storage manually this does not fire.
   */
  #storageListener(changes: { [key: string]: chrome.storage.StorageChange }) {
    console.log("Storage changed.");
    console.log(changes);

    for (const [key, { newValue, oldValue }] of Object.entries(changes)) {
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) continue;

      switch (key) {
        case StorageKeys.ACCOUNTS:
          this.accounts = newValue;
          break;

        case StorageKeys.CURRENT_ADDRESS:
          this.accounts = newValue;
          break;
      }
    }

    console.log("After changes:");
    console.log(this.accounts);
    console.log(this.currentAddress);
  }

  public get accounts() {
    return this.#accounts;
  }

  public set accounts(newValue) {
    chrome.storage.local.set({ [StorageKeys.ACCOUNTS]: newValue });
  }

  public get currentAddress() {
    return this.#currentAddress;
  }

  public set currentAddress(newValue) {
    chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: newValue });
  }
}
