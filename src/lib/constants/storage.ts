export enum StorageKeys {
  PUBLIC_KEY = "publicKey",
  PRIVATE_KEY = "privateKey",
  ACCOUNTS = "accounts",
  CURRENT_ADDRESS = "currentAddress",
}

export type KeyStorage = Record<StorageKeys | string, string | undefined>;

export type Accounts = Record<string, KeyStorage>;
