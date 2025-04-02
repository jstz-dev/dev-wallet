import Jstz from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

enum SignerResponseEventTypes {
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
  GET_ADDRESS_RESPONSE = "JSTZ_GET_ADDRESS_RESPONSE_FROM_EXTENSION",
  ERROR = "JSTZ_ERROR_FROM_EXTENSION",
}

enum SignerRequestEventTypes {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

export interface ExtensionError {
  error: string;
}

export interface ExtensionResponse<T = unknown> {
  type: SignerResponseEventTypes;
  data: T;
}

export interface SignResponse
  extends ExtensionResponse<{
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  }> {}

export interface GetAddressResponse
  extends ExtensionResponse<{
    accountAddress: string;
  }> {}

interface SignRequestCall {
  type: SignerRequestEventTypes.SIGN;
  content: Jstz.Operation.RunFunction;
}

interface GetSignerAddressCall {
  type: SignerRequestEventTypes.GET_ADDRESS;
}

export class JstzSigner {
  private getResponseType(reqType: SignerRequestEventTypes) {
    switch (reqType) {
      case SignerRequestEventTypes.SIGN:
        return SignerResponseEventTypes.SIGN_RESPONSE;
      case SignerRequestEventTypes.GET_ADDRESS:
        return SignerResponseEventTypes.GET_ADDRESS_RESPONSE;
      default:
        throw new Error("Unknown request type");
    }
  }

  public callExtension<T = unknown>(payload: SignRequestCall | GetSignerAddressCall) {
    const event = new CustomEvent<typeof payload>(payload.type, {
      detail: payload,
    });

    window.dispatchEvent(event);

    return new Promise<ExtensionResponse<T>>((resolve, reject) => {
      window.addEventListener(
        this.getResponseType(payload.type),
        ((event: CustomEvent<ExtensionError | ExtensionResponse<T>>) => {
          return "error" in event.detail
            ? reject(new Error(event.detail.error))
            : resolve(event.detail);
        }) as EventListener,
        { once: true },
      );
    });
  }
}

// EXAMPLE IMPLEMENTATION

export async function callSmartFunction({
  smartFunctionRequest,
  onSignatureReceived,
}: {
  smartFunctionRequest: Jstz.Operation.RunFunction;
  onSignatureReceived: (response: SignResponse) => void;
}): Promise<void | Error> {
  const { data } = await requestSignature(smartFunctionRequest);
  onSignatureReceived(data);
}

function requestSignature(requestToSign: Jstz.Operation.RunFunction) {
  const jstzSigner = new JstzSigner();

  return jstzSigner.callExtension<SignResponse>({
    type: SignerRequestEventTypes.SIGN,
    content: requestToSign,
  });
}

async function callCounterSmartFunction({
  smartFunctionAddress,
  pathToCall,
  message,
  requestOptions = {},
}: {
  smartFunctionAddress: string;
  pathToCall?: string;
  message?: string;
  requestOptions?: Partial<Jstz.Operation.RunFunction>;
}) {
  try {
    // Create a request to smart function to sign by extension
    // and wait for the signed payload or error
    await callSmartFunction({
      smartFunctionRequest: {
        _type: "RunFunction",
        body: Array.from(
          encoder.encode(
            JSON.stringify({
              message,
            }),
          ),
        ),
        gas_limit: 55000,
        headers: {},
        method: "GET",
        uri: `tezos://${smartFunctionAddress}${pathToCall ?? ""}`,
        ...requestOptions,
      },
      onSignatureReceived,
    });
  } catch (err: any) {
    console.info("Error signing operation: ", err.message);
  }
}

async function onSignatureReceived(response: SignResponse) {
  const { operation, signature, publicKey, accountAddress } = response.data;

  console.info(`Operation signed with address: ${accountAddress}`);

  const jstzClient = new Jstz.Jstz({
    timeout: 6000,
  });

  try {
    const {
      result: { inner },
    } = await jstzClient.operations.injectAndPoll({
      inner: operation,
      public_key: publicKey,
      signature,
    });

    let returnedMessage = "No message.";

    if (typeof inner === "object" && "body" in inner) {
      returnedMessage = inner.body && JSON.parse(decoder.decode(new Uint8Array(inner.body)));
    }

    if (typeof inner === "string") {
      returnedMessage = inner;
    }

    console.info(`Completed call. Response: ${returnedMessage}`);
  } catch (err) {
    console.error(JSON.stringify(err));
  }
}
