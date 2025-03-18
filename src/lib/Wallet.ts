import { StorageKeys, type Accounts } from "./constants/storage";

export class Wallet {
  #accounts: Accounts = {};
  #currentAddress: string | null = null;

  #deconstructor = new FinalizationRegistry((_heldValue) => {
    chrome.storage.local.onChanged.removeListener(this.#storageListener);
  });

  constructor() {
    chrome.storage.local
      .get<{
        [StorageKeys.ACCOUNTS]: Accounts;
        [StorageKeys.CURRENT_ADDRESS]: string | null;
      }>([StorageKeys.ACCOUNTS, StorageKeys.CURRENT_ADDRESS])
      .then(({ accounts, currentAddress }) => {
        if (accounts) this.#accounts = accounts;
        if (currentAddress) this.#currentAddress = currentAddress;
      });

    chrome.storage.local.onChanged.addListener(this.#storageListener);

    this.#deconstructor.register(this, Wallet.name);
  }

  /**
   * Sign an operation using the currently selected account.
   */
  async sign() {}

  /**
   * Adds a new account to the `Wallet` and save it in the local store.
   * If there is already an account on the provided address it'll replace it.
   */
  async addAccount(accountAddress: string, privateKey: string, publicKey: string) {
    const accounts = await chrome.storage.local.get<Accounts>(StorageKeys.ACCOUNTS);

    accounts[accountAddress] = {
      privateKey,
      publicKey,
    };

    this.accounts = accounts;
  }

  #storageListener(changes: { [key: string]: chrome.storage.StorageChange }) {
    for (const [key, { newValue }] of Object.entries(changes)) {
      switch (key) {
        case StorageKeys.ACCOUNTS:
          this.#accounts = newValue;
          break;

        case StorageKeys.CURRENT_ADDRESS:
          this.#accounts = newValue;
          break;
      }
    }
  }

  get accounts() {
    return this.#accounts;
  }

  set accounts(newValue) {
    this.#accounts = newValue;
    chrome.storage.local.set({ [StorageKeys.ACCOUNTS]: newValue });
  }

  get currentAddress() {
    return this.#currentAddress;
  }

  set currentAddress(newValue) {
    this.#currentAddress = newValue;
    chrome.storage.local.set({ [StorageKeys.CURRENT_ADDRESS]: newValue });
  }
}
