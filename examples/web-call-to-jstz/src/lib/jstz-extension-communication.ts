import Jstz from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export enum WalletEvents {
  SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
  SIGN_RESPONSE = "JSTZ_SIGN_RESPONSE_FROM_EXTENSION",
}

export interface SignResponse {
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

export async function callSmartFunction({
  smartFunctionRequest,
  onSignatureReceived,
}: {
  smartFunctionRequest: Jstz.Operation.RunFunction;
  onSignatureReceived: (response: SignResponse) => void;
}): Promise<void | Error> {
  const signatureResponse = await requestSignature(smartFunctionRequest);
  onSignatureReceived(signatureResponse);
}

function requestSignature(requestToSign: Jstz.Operation.RunFunction) {
  const signEvent = new CustomEvent<{ type: WalletEvents; content: Jstz.Operation.RunFunction }>(
    WalletEvents.SIGN,
    {
      detail: { type: WalletEvents.SIGN, content: requestToSign },
    },
  );
  console.info("Requesting signature from the extension...");

  window.dispatchEvent(signEvent);

  console.info("Waiting for the signed payload...");

  return new Promise<SignResponse>((resolve, reject) => {
    window.addEventListener(
      WalletEvents.SIGN_RESPONSE,
      ((event: SignResponseEvent) => {
        return "error" in event.detail
          ? reject(new Error(event.detail.error))
          : resolve(event.detail);
      }) as EventListener,
      { once: true },
    );
  });
}

// EXAMPLE IMPLEMENTATION

export interface SignError {
  error: string;
}
export type SignResponseEvent = CustomEvent<SignResponse | SignError>;

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
