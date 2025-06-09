import Jstz from "@jstz-dev/jstz-client";

import * as JstzSigner from "./jstz-signer";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

// EXAMPLE IMPLEMENTATION
export async function callSmartFunction({
  smartFunctionRequest,
  onSignatureReceived,
}: {
  smartFunctionRequest: Jstz.Operation.RunFunction;
  onSignatureReceived: (
    response: { data: JstzSigner.SignResponse },
    jstzClient: Jstz,
  ) => Promise<void>;
}) {
  const jstzSigner = new JstzSigner.JstzSigner(window);
  const request = await jstzSigner.callSignerExtension<JstzSigner.SignResponse>({
    type: JstzSigner.SignerRequestEventTypes.SIGN,
    content: smartFunctionRequest,
  }, {timeout: 1000 * 60});

  const jstzClient = new Jstz.Jstz({
    baseURL:
      (process.env.NEXT_PUBLIC_JSTZ_NODE_ENDPOINT as string | undefined) ??
      "https://sandbox.jstz.info",
    timeout: 6000,
  });
  await onSignatureReceived(request, jstzClient);
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
        gasLimit: 55000,
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

async function onSignatureReceived(response: { data: JstzSigner.SignResponse }) {
  const { operation, signature } = response.data;

  const jstzClient = new Jstz.Jstz({
    baseURL:
      (process.env.NEXT_PUBLIC_JSTZ_NODE_ENDPOINT as string | undefined) ??
      "https://sandbox.jstz.info",
    timeout: 6000,
  });

  try {
    const {
      result: { inner },
    } = await jstzClient.operations.injectAndPoll({
      inner: operation,
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
