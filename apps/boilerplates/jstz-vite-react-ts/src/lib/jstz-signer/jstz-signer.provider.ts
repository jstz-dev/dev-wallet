import Jstz from "@jstz-dev/jstz-client";

// Extension events
export const SignerRequestEvents = {
  CHECK_STATUS: "JSTZ_CHECK_EXTENSION_AVAILABILITY_REQUEST_TO_EXTENSION",
  SIGN: "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  GET_ADDRESS: "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
} as const;

export type SignerRequestEventTypeKeys = keyof typeof SignerRequestEvents;
export type SignerRequestEventTypes = typeof SignerRequestEvents;

export const SignerResponseEvents = {
  CHECK_STATUS_RESPONSE: "JSTZ_CHECK_EXTENSION_AVAILABILITY_RESPONSE_FROM_EXTENSION",
  SIGN_RESPONSE: "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  GET_ADDRESS_RESPONSE: "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
} as const;

export type SignerResponseEventKeys = keyof typeof SignerResponseEvents;
export type SignerResponseEventTypes = typeof SignerResponseEvents;

export interface ExtensionError {
  type: SignerResponseEventTypes;
  error: string;
}

// Signer requests
export interface SignRequestCall {
  type: SignerRequestEventTypes["SIGN"];
  content: unknown;
}

export interface CheckStatusCall {
  type: SignerRequestEventTypes["CHECK_STATUS"];
}

export interface GetSignerAddressCall {
  type: SignerRequestEventTypes["GET_ADDRESS"];
}

// Extension responses
export interface ExtensionResponse<T = unknown> {
  type: SignerResponseEventTypes;
  data: T;
}

export interface SignResponse {
  operation: Jstz.Operation;
  signature: string;
  verifier: {
    Passkey: {
      authenticatorData: string;
      clientDataJSON: string;
    };
  } | null;
}

export interface GetAddressResponse {
  accountAddress: string;
}

export interface CheckStatusResponse {
  success: boolean;
}

/** An event dispatcher for Signer extensions */
export class JstzSignerProvider {
  eventTarget: EventTarget;
  constructor(eventTarget: EventTarget) {
    this.eventTarget = eventTarget;
  }

  private getResponseType(reqType: SignerRequestEventTypes[SignerRequestEventTypeKeys]) {
    switch (reqType) {
      case SignerRequestEvents.SIGN:
        return SignerResponseEvents.SIGN_RESPONSE;
      case SignerRequestEvents.GET_ADDRESS:
        return SignerResponseEvents.GET_ADDRESS_RESPONSE;
      case SignerRequestEvents.CHECK_STATUS:
        return SignerResponseEvents.CHECK_STATUS_RESPONSE;
      default:
        throw new Error("Unknown request type");
    }
  }

  /**
   * Dispatch a Signer request event on `this.eventTarget`. Returns a Promise listening for the
   * corresponding `ExtensionResponse` event.
   *
   * Signer extensions (typically, a browser wallet) should listen for the given payloads on
   * `this.eventTarget` and emit an `ExtensionResponse<T>` if succesfully handled or
   * `ExtensionError` if not
   */
  public callSignerExtension<T = SignResponse | GetAddressResponse | CheckStatusResponse>(
    payload: SignRequestCall | GetSignerAddressCall | CheckStatusCall,
    options?: {
      timeout?: number;
    },
  ): Promise<ExtensionResponse<T>> {
    const event = new CustomEvent<typeof payload>(payload.type, {
      detail: payload,
    });

    this.eventTarget.dispatchEvent(event);

    const { timeout } = options || {};

    return new Promise<ExtensionResponse<T>>((resolve, reject) => {
      let eventFired = false;

      if (timeout) {
        setTimeout(() => {
          if (!eventFired) {
            reject(new Error("Extension is not responding"));
          }
        }, timeout);
      }

      this.eventTarget.addEventListener(
        this.getResponseType(payload.type),
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
