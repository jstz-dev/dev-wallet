import type { WebAuthnCredential } from "@simplewebauthn/server";

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
