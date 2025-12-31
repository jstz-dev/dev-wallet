import Jstz, { type ClientOptions } from "@jstz-dev/jstz-client";

import {
  JstzSignerProvider,
  SignerRequestEvents,
  type CheckStatusResponse,
  type GetAddressResponse,
  type SignResponse,
} from "./jstz-signer.provider.ts";

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

export class JstzSignerClient {
  static jstzSignerProvider: JstzSignerProvider = new JstzSignerProvider(window);

  static createJstzClient(options?: Partial<JstzSignerClientOptions>) {
    const { baseURL, timeout = 60_000, ...restOptions } = options ?? {};
    return new Jstz.Jstz({
      baseURL: baseURL ?? import.meta.env.VITE_JSTZ_RPC_URL,
      timeout,
      ...restOptions,
    });
  }

  static async checkExtensionAvailability() {
    return await this.jstzSignerProvider.callSignerExtension<CheckStatusResponse>(
      {
        type: SignerRequestEvents.CHECK_STATUS,
      },
      { timeout: 500 },
    );
  }

  static async requestAddress() {
    return await this.jstzSignerProvider.callSignerExtension<GetAddressResponse>({
      type: SignerRequestEvents.GET_ADDRESS,
    });
  }

  static async signWithJstzSigner({ content, signerOptions }: SignWithJstzSignerParams) {
    return await this.jstzSignerProvider.callSignerExtension<SignResponse>(
      {
        type: SignerRequestEvents.SIGN,
        content,
      },
      signerOptions,
    );
  }
}
