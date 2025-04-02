import Jstz from "@jstz-dev/jstz-client";

import { SignerRequestEventTypes, SignResponse } from "~/lib/jstz-signer";

import "./jstz";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

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
  //@ts-expect-error - d.ts should handle the issue
  return window.jstzCallSignerExtension<SignResponse>({
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
