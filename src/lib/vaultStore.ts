import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { Accounts } from "./constants/storage";

interface VaultStoreState {
  currentAddress: string;
  currentNetwork: string;
  customNetworks: string[];
  accounts: Accounts;
}

type Account = Accounts[string] & {
  address: string;
};

interface VaultStoreActions {
  setCurrentAddress: (currentAddress: VaultStoreState["currentAddress"]) => void;
  setCurrentNetwork: (network: string) => void;
  setCustomNetworks: (networks: string[]) => void;
  setAccounts: (accounts: VaultStoreState["accounts"]) => void;
  addAccount: (account: Account) => void;
}

type VaultStore = VaultStoreState & VaultStoreActions;

const storageLocal: PersistStorage<VaultStore> = {
  getItem: async (key: string) => {
    const { [key]: value } = await chrome.storage.local.get(key);
    return value as StorageValue<VaultStore>;
  },

  setItem: (key: string, value: unknown) => {
    return chrome.storage.local.set({ [key]: value });
  },

  removeItem: (key: string) => {
    return chrome.storage.local.remove(key);
  },
};

const persistence = persist<VaultStore>(
  (set, get) => ({
    accounts: {},
    setAccounts: (accounts) => set({ accounts }),
    addAccount: ({ address, privateKey, publicKey }) => {
      const accounts = get().accounts;

      set({ accounts: { ...accounts, [address]: { privateKey, publicKey } } });
    },
    currentAddress: "",
    setCurrentAddress: (currentAddress) => set({ currentAddress }),

    currentNetwork: "http://localhost:8933",
    customNetworks: [],
    setCurrentNetwork: (network) => set({ currentNetwork: network }),
    setCustomNetworks: (networks) => set({ customNetworks: networks }),
  }),
  {
    name: "vault",
    storage: storageLocal,
  },
);

export const useVault = createSelectors(create(persistence));

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

function createSelectors<S extends UseBoundStore<StoreApi<object>>>(_store: S) {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    // eslint-disable-next-line
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
}

export const vault = createStore(persistence);
