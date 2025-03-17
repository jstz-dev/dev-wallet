export enum StorageKeys {
  PUBLIC_KEY = "publicKey",
  PRIVATE_KEY = "privateKey",
  ACCOUNTS = "accounts",
  CURRENT_ADDRESS = "currentAddress",
}

export type KeyStorage = Record<
  StorageKeys.PUBLIC_KEY | StorageKeys.PRIVATE_KEY,
  string | undefined
>;

export type Accounts = Record<string, KeyStorage>;
