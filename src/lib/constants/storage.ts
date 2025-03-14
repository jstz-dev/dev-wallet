export enum StorageKeys {
  ACCOUNT_PUBLIC_KEY = "account_public_key",
  ACCOUNT_PRIVATE_KEY = "account_private_key",
}

export type KeyStorage = Record<StorageKeys | string, string | null>;
