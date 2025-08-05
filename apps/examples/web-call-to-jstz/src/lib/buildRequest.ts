import JstzType from "@jstz-dev/jstz-client";

const encoder = new TextEncoder();

type RequestParams = Partial<JstzType.Operation.RunFunction> & {
  smartFunctionAddress: string;
  path?: string;
  message?: string;
};

export function buildRequest({
  smartFunctionAddress,
  path,
  message = "",
  ...rest
}: RequestParams): JstzType.Operation.RunFunction {
  return {
    _type: "RunFunction",
    body: null,
    gasLimit: 55000,
    headers: {},
    method: "GET",
    uri: `jstz://${smartFunctionAddress}${path ?? ''}`,
    ...rest,
  };
}
