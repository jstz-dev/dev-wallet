import Jstz from "@jstz-dev/jstz-client";

export module JstzSigner {
  export enum SignerResponseEventTypes {
    CHECK_STATUS_RESPONSE = "JSTZ_CHECK_EXTENSION_AVAILABILITY_RESPONSE_FROM_EXTENSION",
    SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
    GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
    ERROR = "JSTZ_ERROR_FROM_EXTENSION",
  }

  export enum SignerRequestEventTypes {
    CHECK_STATUS = "JSTZ_CHECK_EXTENSION_AVAILABILITY_REQUEST_TO_EXTENSION",
    SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
    GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
  }

  export interface ExtensionError {
    type: SignerResponseEventTypes;
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

  export interface CheckStatusCall {
    type: SignerRequestEventTypes.CHECK_STATUS;
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

  export interface CheckStatusResponse {
    success: boolean;
  }

  function getResponseType(reqType: SignerRequestEventTypes) {
    switch (reqType) {
      case SignerRequestEventTypes.SIGN:
        return SignerResponseEventTypes.SIGN_RESPONSE;
      case SignerRequestEventTypes.GET_ADDRESS:
        return SignerResponseEventTypes.GET_ADDRESS_RESPONSE;
      case SignerRequestEventTypes.CHECK_STATUS:
        return SignerResponseEventTypes.CHECK_STATUS_RESPONSE;
      default:
        throw new Error("Unknown request type");
    }
  }

  export function callSignerExtension<T = SignResponse | GetAddressResponse | CheckStatusResponse>(
    payload: SignRequestCall | GetSignerAddressCall | CheckStatusCall,
    options?: {
      timeout?: number;
    },
  ) {
    const event = new CustomEvent<typeof payload>(payload.type, {
      detail: payload,
    });

    window.dispatchEvent(event);

    const { timeout = 5000 } = options || {};

    return new Promise<ExtensionResponse<T>>((resolve, reject) => {
      let eventFired = false;

      setTimeout(() => {
        if (!eventFired) {
          console.error("Timeout waiting for address response");
          reject(new Error("Extension is not responding"));
        }
      }, timeout);

      window.addEventListener(
        getResponseType(payload.type),
        ((event: CustomEvent<ExtensionError | ExtensionResponse<T>>) => {
          eventFired = true;

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
    jstzCallSignerExtension: <
      T = JstzSigner.SignResponse | JstzSigner.GetAddressResponse | JstzSigner.CheckStatusResponse,
    >(
      payload:
        | JstzSigner.SignRequestCall
        | JstzSigner.GetSignerAddressCall
        | JstzSigner.CheckStatusCall,
    ) => Promise<JstzSigner.ExtensionResponse<T>>;
  }
}

window.jstzCallSignerExtension = JstzSigner.callSignerExtension;
