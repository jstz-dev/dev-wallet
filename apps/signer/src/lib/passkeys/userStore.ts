import type { WebAuthnCredential } from "@simplewebauthn/server";

import superjson from "superjson";
import { createStore } from "zustand";
import type { PersistStorage } from "zustand/middleware";
import { devtools, persist } from "zustand/middleware";

import { RP_ID } from "./constants";

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

type UserState = User & UserActions;

superjson.registerCustom(
  {
    isApplicable: (v) => v instanceof Uint8Array,
    serialize: (v) => Buffer.from(v).toString("base64"),
    deserialize: (v) => new Uint8Array(Buffer.from(v, "base64")),
  },
  "uint8Array",
);

const storage: PersistStorage<UserState> = {
  getItem: (key) => {
    const str = localStorage.getItem(key);
    if (!str) return null;

    return superjson.parse(str);
  },

  setItem: (key, value) => {
    localStorage.setItem(key, superjson.stringify(value));
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
  },
};

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
