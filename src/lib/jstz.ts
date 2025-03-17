import * as signer from "jstz_sdk";

export function sign(operation: Record<string, unknown>, secretKey: string) {
  return signer.sign_operation(operation, secretKey);
}
