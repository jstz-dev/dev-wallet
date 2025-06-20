# Call to smart function with chrome extension wallet signing

```typescript
import Jstz from "@jstz-dev/jstz-client";

import { SignerRequestEventTypes, SignResponse } from "~/lib/jstz-signer";

import "./jstz";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

enum SignerRequestEventTypes {
    SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
    GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

enum SignerRequestEventTypes {
    SIGN = "JSTZ_SIGN_REQUEST_TO_EXTENSION",
    GET_ADDRESS = "JSTZ_GET_ADDRESS_REQUEST_TO_EXTENSION",
}

interface ExtensionResponse<T = unknown> {
    type: SignerResponseEventTypes;
    data: T;
}

type SignResponse = ExtensionResponse<{
    operation: Jstz.Operation;
    signature: string;
    publicKey: string;
    accountAddress: string;
}>;

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
                gasLimit: 55000,
                headers: {},
                method: "GET",
                uri: `jstz://${smartFunctionAddress}${pathToCall ?? ""}`,
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
        baseURL: "https://sandbox.jstz.info", //for the remote rpc. Without "baseURL" attribute, Jstz will fallback to default localhost:8933
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

```
