import type Jstz from "@jstz-dev/jstz-client";
import type {
  AuthenticationResponseJSON,
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  RegistrationResponseJSON,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import type { StoreApi } from "zustand";
import { $fetch } from "~/lib/$fetch";
import { asyncFind } from "~/lib/utils";
import { parseKey } from "./encode";
import { type UserState } from "./userStore";

function hash_operation(operation: Jstz.Operation) {
  return $fetch("https://privatenet.jstz.info/operations/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(operation),
  });
}

export class PasskeyWallet {
  readonly #challenges;
  readonly #user;
  readonly #rpId;
  readonly #timeout;
  readonly #expectedOrigin;

  constructor(
    store: StoreApi<UserState>,
    rpId: string,
    expectedOrigin: string[] | string,
    timeout = 60_000,
  ) {
    this.#challenges = new Map<string, string>();
    this.#user = store;
    this.#rpId = rpId;
    this.#timeout = timeout;
    this.#expectedOrigin = expectedOrigin;
  }

  get user() {
    return this.#user;
  }

  async generateRegistrationOptions() {
    const user = this.#user.getState();

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: "jstz signer",
      userName: user.username,
      rpID: this.#rpId,
      timeout: this.#timeout,
      attestationType: "none",

      /**
       * Passing in a user's list of already-registered credential IDs here prevents users from
       * registering the same authenticator multiple times. The authenticator will simply throw an
       * error in the browser if it's asked to perform registration when it recognizes one of the
       * credential ID's.
       */
      excludeCredentials: user.credentials.map((cred) => ({
        id: cred.id,
        type: "public-key",
        transports: cred.transports,
      })),

      authenticatorSelection: {
        residentKey: "discouraged",

        /**
         * Wondering why user verification isn't required?
         *
         * @see {@link https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification}
         */
        userVerification: "preferred",
      },

      /** Support the most common algorithm: ES256 (SHA-256) */
      supportedAlgorithmIDs: [-7],
    };

    const options = await SimpleWebAuthnServer.generateRegistrationOptions(opts);

    /**
     * The server needs to temporarily remember this value for verification, so don't lose it until
     * after you verify the registration response.
     */
    this.#challenges.set(user.id, options.challenge);
    return options;
  }

  /** @throws {Error} When `SimpleWebAuthnServer.verifyRegistrationResponse` fails */
  async verifyRegistration(
    res: RegistrationResponseJSON,
  ): Promise<{ verified: false; publicKey: null } | { verified: true; publicKey: Uint8Array }> {
    const user = this.#user.getState();
    const expectedChallenge = this.#challenges.get(user.id) as string;

    const opts: VerifyRegistrationResponseOpts = {
      response: res,
      expectedChallenge,
      expectedOrigin: this.#expectedOrigin,
      expectedRPID: this.#rpId,
      requireUserVerification: false,
    };

    const verification = await SimpleWebAuthnServer.verifyRegistrationResponse(opts);
    const { verified, registrationInfo } = verification;

    if (verified) {
      const { credential } = registrationInfo;
      const existingCredential = user.credentials.find((cred) => cred.id === credential.id);

      /** Add the returned credential to the user's list of credentials */
      if (!existingCredential) {
        const newCredential: WebAuthnCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: res.response.transports,
        };

        user.addCredential(newCredential);
      }

      return { verified, publicKey: credential.publicKey };
    }

    this.#challenges.delete(user.id);
    return { verified, publicKey: null };
  }

  async generateAuthenticationOptions(operation: Jstz.Operation) {
    const user = this.#user.getState();

    console.log(operation);
    const { data } = await hash_operation(operation);
    const challenge = typeof data === "string" ? data : undefined;

    const allowedCredential = await asyncFind(user.credentials, async (cred) => {
      const key = await parseKey(cred.publicKey);
      return key === operation.publicKey;
    });

    if (!allowedCredential) {
      throw new Error("There is no credential for provided publicKey");
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: this.#timeout,
      challenge,
      allowCredentials: [
        {
          id: allowedCredential.id,
          transports: allowedCredential.transports,
        },
      ],
      /**
       * Wondering why user verification isn't required?
       *
       * @see {@link https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification}
       */
      userVerification: "preferred",
      rpID: this.#rpId,
    };

    const options = await SimpleWebAuthnServer.generateAuthenticationOptions(opts);

    this.#challenges.set(user.id, options.challenge);

    return options;
  }

  /**
   * @throws {RangeError} When there's no credential with the `res.id`
   * @throws {Error} When `SimpleWebAuthnServer.verifyAuthenticationResponse` fails
   */
  async verifyAuthentication(res: AuthenticationResponseJSON) {
    const user = this.#user.getState();
    const expectedChallenge = this.#challenges.get(user.id) as string;

    const credential = user.credentials.find((cred) => cred.id === res.id);
    if (!credential) {
      throw new RangeError("No credential was found for this authentication.");
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: res,
      expectedChallenge,
      expectedOrigin: this.#expectedOrigin,
      expectedRPID: this.#rpId,
      credential,
      requireUserVerification: false,
    };

    const verification = await SimpleWebAuthnServer.verifyAuthenticationResponse(opts);

    const { verified, authenticationInfo } = verification;

    if (verified) {
      credential.counter = authenticationInfo.newCounter;
      user.setCredential(credential);
    }

    this.#challenges.delete(user.id);
    return { verified, signature: res.response.signature };
  }
}
