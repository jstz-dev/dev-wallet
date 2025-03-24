import Jstz from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export enum WalletEvents {
  SIGN = "SIGN",
  SIGN_RESPONSE = "SIGN_RESPONSE",
}

interface SignResponse {
  data: {
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
  };
}

interface SignError {
  error: string;
}

type SignResponseEvent = CustomEvent<SignResponse | SignError>;

export async function callSmartFunction({
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
    const signatureResponse = await requestSignature({
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
    });
    // call the smart function with the signed payload
    void onSignatureReceived(signatureResponse);
  } catch (err: any) {
    console.info("Error signing operation: ", err.message);
  }
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
        return "error" in event.detail ? reject(new Error(event.detail.error)) : resolve(event.detail);
      }) as EventListener,
      { once: true },
    );
  });
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
