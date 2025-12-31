import Jstz, { type ClientOptions } from "@jstz-dev/jstz-client";

import { env } from "~/env";

import * as JstzSigner from "./jstz-signer";

export interface SignWithJstzSignerParams {
  content:
    | Jstz.Operation.RunFunction
    | Jstz.Operation.DeployFunction
    | Jstz.Operation.RevealLargePayload;
  signerOptions?: JstzSignerOptions;
}

export type JstzSignerClientOptions = ClientOptions;
export interface JstzSignerOptions {
  timeout?: number;
}

export function createJstzClient(options?: Partial<JstzSignerClientOptions>) {
  const { baseURL, timeout = 60_000, ...restOptions } = options ?? {};
  return new Jstz.Jstz({
    baseURL: baseURL ?? env.NEXT_PUBLIC_JSTZ_NODE_ENDPOINT,
    timeout,
    ...restOptions,
  });
}

export async function checkExtensionAvailability() {
  const jstzSigner = new JstzSigner.JstzSigner(window);
  return await jstzSigner.callSignerExtension<JstzSigner.CheckStatusResponse>(
    {
      type: JstzSigner.SignerRequestEventTypes.CHECK_STATUS,
    },
    { timeout: 500 },
  );
}

export async function requestAddress() {
  const jstzSigner = new JstzSigner.JstzSigner(window);

  return await jstzSigner.callSignerExtension<JstzSigner.GetAddressResponse>({
    type: JstzSigner.SignerRequestEventTypes.GET_ADDRESS,
  });
}

export async function signWithJstzSigner({ content, signerOptions }: SignWithJstzSignerParams) {
  const jstzSigner = new JstzSigner.JstzSigner(window);
  return await jstzSigner.callSignerExtension<JstzSigner.SignResponse>(
    {
      type: JstzSigner.SignerRequestEventTypes.SIGN,
      content,
    },
    signerOptions,
  );
}
