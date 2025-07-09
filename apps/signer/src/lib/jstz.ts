import * as signer from "jstz_sdk";
import Jstz from "@jstz-dev/jstz-client";


export function sign(operation: Jstz.Operation, secretKey: string) {
  return signer.sign_operation(operation, secretKey);
}
