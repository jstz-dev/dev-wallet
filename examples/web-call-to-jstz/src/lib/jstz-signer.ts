import Jstz from "@jstz-dev/jstz-client";

enum SignerResponseEventTypes {
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
}

enum SignerRequestEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

interface ExtensionError {
  error: string;
}

interface ExtensionResponse<T = unknown> {
  type: SignerResponseEventTypes;
  data: T;
}

interface SignRequestCall {
  type: SignerRequestEventTypes.SIGN;
  content: Jstz.Operation.RunFunction;
}

interface GetSignerAddressCall {
  type: SignerRequestEventTypes.GET_ADDRESS;
}

type SignResponse = ExtensionResponse<{
  operation: Jstz.Operation;
  signature: string;
  publicKey: string;
  accountAddress: string;
}>;

type GetAddressResponse = ExtensionResponse<{
  accountAddress: string;
}>;

function callSignerExtension<T = SignResponse | GetAddressResponse>(
    payload: SignRequestCall | GetSignerAddressCall,
) {
  const event = new CustomEvent<typeof payload>(payload.type, {
    detail: payload,
  });

  window.dispatchEvent(event);

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

export {
  callSignerExtension,
  SignerResponseEventTypes,
  SignerRequestEventTypes,
  type ExtensionResponse,
  type ExtensionError,
  type SignRequestCall,
  type GetSignerAddressCall,
  type SignResponse,
  type GetAddressResponse,
};