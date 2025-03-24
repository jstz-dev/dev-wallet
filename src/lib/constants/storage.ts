export enum StorageKeys {
  PUBLIC_KEY = "publicKey",
  PRIVATE_KEY = "privateKey",
  ACCOUNTS = "accounts",
  CURRENT_ADDRESS = "currentAddress",
}

export interface KeyStorage {
  [StorageKeys.PUBLIC_KEY]: string;
  [StorageKeys.PRIVATE_KEY]: string;
}

export type Accounts = Record<string, KeyStorage>;

export type Account = Accounts[string] & {
  address: string;
};

