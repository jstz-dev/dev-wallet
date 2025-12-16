import { useQuery } from "@tanstack/react-query";

import { useState } from "react";
import { accounts } from "~/queries/account.queries";
import * as JstzSigner from "../jstz-signer.service";
import { checkExtensionAvailability, signWithJstzSigner } from "../jstz-signer.service";
import { accountSchema } from "../validators/account";

export function useJstzSignerExtension({ onFill }: { onFill?: (address: string) => void } = {}) {
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [jstzWalletAddress, setJstzWalletAddress] = useState("");

  async function checkAvailability() {
    try {
      setIsLoading(true);
      const { data } = await checkExtensionAvailability();

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

  function updateJstzWalletAddress(address: string) {
    setJstzWalletAddress(address);
    onFill?.(address);
  }

  async function fillJstzWallet() {
    const isExtensionAvailable = await checkAvailability();
    if (!isExtensionAvailable) {
      throw new Error("JstzSigner extension is not available");
    }
    const { data } = await JstzSigner.requestAddress();
    updateJstzWalletAddress(data.accountAddress);
  }

  const { data: jstzWalletBalance } = useQuery({
    ...accounts.balance(jstzWalletAddress),
    select: (data) => ({
      balance: data?.balance,
      isValid: accountSchema.shape.address.safeParse(jstzWalletAddress).success,
    }),
    enabled:
      !!jstzWalletAddress && accountSchema.shape.address.safeParse(jstzWalletAddress).success,
  });

  async function signWithJstzExtension(payload: JstzSigner.SignWithJstzSignerParams) {
    try {
      const response = await signWithJstzSigner(payload);

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
    checkExtensionAvailability: checkAvailability,
    fillJstzWallet,
    jstzWalletAddress,
    jstzWalletBalance,
    signWithJstzExtension,
    updateJstzWalletAddress,
  };
}
