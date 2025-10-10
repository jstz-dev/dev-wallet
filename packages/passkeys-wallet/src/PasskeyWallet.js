/**
 * @import {Jstz} from "@jstz-dev/jstz-client";
 * @import {AuthenticationResponseJSON, GenerateAuthenticationOptionsOpts, GenerateRegistrationOptionsOpts, RegistrationResponseJSON, VerifyAuthenticationResponseOpts, VerifyRegistrationResponseOpts, WebAuthnCredential} from "@simplewebauthn/server";
 * @import {StoreApi} from "zustand";
 * @import {UserState} from "./types";
 */

import * as SimpleWebAuthnServer from "@simplewebauthn/server";

import { $fetch } from "./$fetch";
import { parseKey } from "./encode";

/** @param {Jstz.Operation} operation */
function hash_operation(operation) {
  return $fetch("https://privatenet.jstz.info/operations/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(operation),
  });
}

export class Wallet {
  /** @type {Map<string, string>} */
  #challenges;

  #user;
  #rpId;
  #timeout;
  #expectedOrigin;

  /**
   * @param {StoreApi<UserState>} store
   * @param {string} rpId
   * @param {string[] | string} expectedOrigin
   * @param {number} [timeout]
   */
  constructor(store, rpId, expectedOrigin, timeout = 60_000) {
    this.#challenges = new Map();
    this.#user = store;
    this.#rpId = rpId;
    this.#timeout = timeout;
    this.#expectedOrigin = expectedOrigin;
  }

  async generateRegistrationOptions() {
    const user = this.#user.getState();

    /** @type {GenerateRegistrationOptionsOpts} */
    const opts = {
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

  /**
   * @param {RegistrationResponseJSON} res
   * @throws {Error} When `SimpleWebAuthnServer.verifyRegistrationResponse` fails
   */
  async verifyRegistration(res) {
    const user = this.#user.getState();
    const expectedChallenge = /** @type {string} */ (this.#challenges.get(user.id));

    /** @type {VerifyRegistrationResponseOpts} */
    const opts = {
      response: res,
      expectedChallenge,
      expectedOrigin: this.#expectedOrigin,
      expectedRPID: this.#rpId,
      requireUserVerification: false,
    };

    const verification = await SimpleWebAuthnServer.verifyRegistrationResponse(opts);
    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;
      const existingCredential = user.credentials.find((cred) => cred.id === credential.id);

      /** Add the returned credential to the user's list of credentials */
      if (!existingCredential) {
        /** @type {WebAuthnCredential} */
        const newCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: res.response.transports,
        };

        user.addCredential(newCredential);
      }
    }

    this.#challenges.delete(user.id);
    return verified;
  }

  /** @param {Jstz.Operation["content"]} [operation] */
  async generateAuthenticationOptions(operation) {
    const user = this.#user.getState();

    const cred = /** @type {WebAuthnCredential} */ (user.credentials[0]);
    let publicKey;

    try {
      publicKey = await parseKey(cred.publicKey);
    } catch (e) {
      console.error(e);
      throw e;
    }

    /** @type {string | undefined} */
    let challenge;
    if (operation) {
      const { data, error } = await hash_operation({ content: operation, publicKey, nonce: 0 });

      if (error) {
        console.error(error);
        throw error;
      }

      challenge = typeof data === "string" ? data : undefined;
    }

    /** @type {GenerateAuthenticationOptionsOpts} */
    const opts = {
      timeout: this.#timeout,
      challenge,
      allowCredentials: user.credentials.map((cred) => ({
        id: cred.id,
        type: "public-key",
        transports: cred.transports,
      })),
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
   * @param {AuthenticationResponseJSON} res
   * @throws {RangeError} When there's no credential with the `res.id`
   * @throws {Error} When `SimpleWebAuthnServer.verifyAuthenticationResponse` fails
   */
  async verifyAuthentication(res) {
    const user = this.#user.getState();
    const expectedChallenge = /** @type {string} */ (this.#challenges.get(user.id));

    const credential = user.credentials.find((cred) => cred.id === res.id);
    if (!credential) {
      throw new RangeError("No credential was found for this authentication.");
    }

    /** @type {VerifyAuthenticationResponseOpts} */
    const opts = {
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
