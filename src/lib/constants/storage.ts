export enum StorageKeys {
  ACCOUNT_PUBLIC_KEY = "account_public_key",
  ACCOUNT_PRIVATE_KEY = "account_private_key",
  ACCOUNTS = "accounts",
  CURRENT_ADDRESS = "current_address",
}

export type KeyStorage = Record<StorageKeys | string, string | undefined>;

export type Accounts = Record<string, KeyStorage>;
