import type { WebAuthnCredential } from "@simplewebauthn/server";

import SuperJSON from "superjson";
import { createStore } from "zustand";
import type { PersistStorage } from "zustand/middleware";
import { devtools, persist } from "zustand/middleware";
import { RP_ID } from "~/lib/constants/RP_ID";

interface User {
  id: string;
  username: string;
  credentials: WebAuthnCredential[];
}

interface UserActions {
  addCredential: (cred: WebAuthnCredential) => void;
  removeCredential: (credId: WebAuthnCredential["id"]) => void;
  setCredential: (cred: WebAuthnCredential) => void;
}

export type UserState = User & UserActions;

SuperJSON.registerCustom(
  {
    isApplicable: (v) => v instanceof Uint8Array,
    serialize: (v) => Buffer.from(v).toString("base64"),
    deserialize: (v) => new Uint8Array(Buffer.from(v, "base64")),
  },
  "uint8Array",
);

const storage: PersistStorage<UserState> = {
  getItem: async (key) => {
    const { [key]: str } = await chrome.storage.local.get(key);
    if (!str) return null;

    return SuperJSON.parse(str as string);
  },

  setItem: (key, value) => {
    void chrome.storage.local.set({ [key]: SuperJSON.stringify(value) });
  },

  removeItem: (key) => {
    return chrome.storage.local.remove(key);
  },
};

// TODO: Think about making it a slice for the vault store.
export const userStore = createStore<UserState>()(
  devtools(
    persist(
      (set) => ({
        id: crypto.randomUUID(),
        username: `user@${RP_ID}`,
        credentials: [],

        addCredential: (cred) =>
          set(({ credentials }) => ({ credentials: credentials.concat(cred) })),

        removeCredential: (credId) =>
          set(({ credentials }) => ({
            credentials: credentials.filter((cred) => cred.id !== credId),
          })),

        setCredential: (newCred) =>
          set(({ credentials }) => ({
            credentials: credentials.map((cred) => (cred.id === newCred.id ? newCred : cred)),
          })),
      }),
      {
        name: "user-storage",
        storage,
      },
    ),
  ),
);
