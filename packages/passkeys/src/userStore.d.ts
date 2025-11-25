import type { WebAuthnCredential } from "@simplewebauthn/browser";

export interface User {
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

export interface UserStore {
  getState(): UserState;
}
