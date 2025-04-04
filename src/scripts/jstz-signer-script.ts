import Jstz from "@jstz-dev/jstz-client";

//eslint-disable @typescript-eslint/prefer-namespace-keyword
export module JstzSigner {
  export enum SignerResponseEventTypes {
    SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
    GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
    ERROR = "JSTZ_ERROR_FROM_EXTENSION",
  }

  export enum SignerRequestEventTypes {
    SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
    GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  }

  export interface ExtensionError {
    type: SignerResponseEventTypes,
    error: string;
  }

  export interface ExtensionResponse<T = unknown> {
    type: SignerResponseEventTypes;
    data: T;
  }

  export interface SignRequestCall {
    type: SignerRequestEventTypes.SIGN;
    content: Jstz.Operation.RunFunction;
  }

  export interface GetSignerAddressCall {
    type: SignerRequestEventTypes.GET_ADDRESS;
  }

  export interface SignResponse {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  }

  export interface GetAddressResponse {
    accountAddress: string;
  }

  function getResponseType(reqType: SignerRequestEventTypes) {
    switch (reqType) {
      case SignerRequestEventTypes.SIGN:
        return SignerResponseEventTypes.SIGN_RESPONSE;
      case SignerRequestEventTypes.GET_ADDRESS:
        return SignerResponseEventTypes.GET_ADDRESS_RESPONSE;
      default:
        throw new Error("Unknown request type");
    }
  }

  export function callSignerExtension<T = SignResponse | GetAddressResponse>(
      payload: SignRequestCall | GetSignerAddressCall,
  ) {
    const event = new CustomEvent<typeof payload>(payload.type, {
      detail: payload,
    });

    window.dispatchEvent(event);

    return new Promise<ExtensionResponse<T>>((resolve, reject) => {
      window.addEventListener(
          getResponseType(payload.type),
          ((event: CustomEvent<ExtensionError | ExtensionResponse<T>>) => {
            if ("error" in event.detail) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail);
            }
          }) as EventListener,
          { once: true },
      );
    });
  }
}

declare global {
  interface Window {
    jstzCallSignerExtension: <T = JstzSigner.SignResponse | JstzSigner.GetAddressResponse>(
        payload: JstzSigner.SignRequestCall | JstzSigner.GetSignerAddressCall,
    ) => Promise<JstzSigner.ExtensionResponse<T>>;
  }
}


window.jstzCallSignerExtension = JstzSigner.callSignerExtension;
