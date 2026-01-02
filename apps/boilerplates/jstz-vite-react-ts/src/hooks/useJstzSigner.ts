import { useState } from "react";

import {
  JstzSignerClient,
  type SignWithJstzSignerParams,
} from "~/lib/jstz-signer/jstz-signer.client";

export function useJstzSigner() {
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function checkExtensionAvailability() {
    try {
      setIsLoading(true);
      const { data } = await JstzSignerClient.checkExtensionAvailability();

      await new Promise((resolve) => {
        setTimeout(() => {
          setIsExtensionAvailable(data.success);
          resolve(undefined);
        }, 1000);
      });

      return data.success;
    } catch (e) {
      console.warn(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function getWalletAddress() {
    try {
      const response = await JstzSignerClient.requestAddress();

      const { accountAddress } = response.data;

      return { accountAddress };
    } catch (err) {
      console.error(JSON.stringify(err), err);
      throw err;
    }
  }

  async function signOperation(payload: SignWithJstzSignerParams) {
    try {
      const response = await JstzSignerClient.signWithJstzSigner({
        ...payload,
        signerOptions: { timeout: 10_000 },
      });

      const { operation, signature, verifier } = response.data;

      return { operation, signature, verifier };
    } catch (err) {
      console.error(JSON.stringify(err), err);
      throw err;
    }
  }

  return {
    isLoading,
    isExtensionAvailable,
    checkExtensionAvailability,
    getWalletAddress,
    signOperation,
  };
}
