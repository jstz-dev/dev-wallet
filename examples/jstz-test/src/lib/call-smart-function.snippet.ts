import Jstz from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export enum WalletEvents {
  SIGN = "SIGN",
}

interface SignRequestPayload {
  type: WalletEvents.SIGN;
  data: {
    content: Jstz.Operation.DeployFunction | Jstz.Operation.RunFunction;
  };
}

interface SignResponse {
  operation: Jstz.Operation;
  signature: string;
  publicKey: string;
  accountAddress: string;
}

interface SignError {
  error: string;
}

// extensionId can be obtained from chrome://extensions
const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

export function buildRequest({
  smartFunctionAddress,
  path,
  message = "",
  ...rest
}: Partial<Jstz.Operation.RunFunction> & {
  smartFunctionAddress: string;
  path?: string;
  message?: string;
}): Jstz.Operation.RunFunction {
  return {
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
    uri: `tezos://${smartFunctionAddress}${path ?? ""}`,
    ...rest,
  };
}

/**
 * Sends a message to the Chrome extension. Resolves with the payload or error.
 * @param data
 */

export function sendMessage<T>(data: SignRequestPayload): Promise<T | SignError> {
  return new Promise((res) => {
    chrome.runtime.sendMessage(extensionId, data, {}, (response) => {
      res(response);
    });
  });
}

export async function callSmartFunction(smartFunctionAddress: string, pathToCall?: string) {
  const requestToSign = buildRequest({ smartFunctionAddress, path: pathToCall });

  try {
    console.info("Sending a request to sign...");

    const signingResponse = await sendMessage<SignResponse>({
      type: WalletEvents.SIGN,
      data: { content: requestToSign },
    });

    if ("error" in signingResponse) {
      console.error(`Error signing operation: ${signingResponse.error}`);
      return;
    }

    const { operation, signature, publicKey, accountAddress } = signingResponse;

    console.info(`Operation signed with address: ${accountAddress}`);

    const jstzClient = new Jstz.Jstz({
      timeout: 6000,
    });

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
