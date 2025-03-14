export enum StorageKeys {
  ACCOUNT_PUBLIC_KEY = "account_public_key",
  ACCOUNT_PRIVATE_KEY = "account_private_key",
}

export type KeyStorage = {
  [StorageKeys.ACCOUNT_PUBLIC_KEY]?: string | null;
  [StorageKeys.ACCOUNT_PRIVATE_KEY]?: string | null;
};
