export enum StorageKeysEnum {
  ACCOUNT_PUBLIC_KEY = "account_public_key",
  ACCOUNT_PRIVATE_KEY = "account_private_key",
}

export type AccountStorageType = Record<
  string,
  {
    [StorageKeysEnum.ACCOUNT_PUBLIC_KEY]: string | null | undefined;
    [StorageKeysEnum.ACCOUNT_PRIVATE_KEY]: string | null | undefined;
  }
>;
