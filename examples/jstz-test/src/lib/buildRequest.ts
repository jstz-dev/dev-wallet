import JstzType from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();

export function buildRequest(
  contractAddress: string,
  message: string,
): JstzType.Operation.RunFunction {
  return {
    _type: "RunFunction",
    body: Array.from(
      encoder.encode(
        JSON.stringify({
          message: message,
        }),
      ),
    ),
    gas_limit: 55000,
    headers: {},
    method: "GET",
    uri: `tezos://${contractAddress}`,
  };
}
