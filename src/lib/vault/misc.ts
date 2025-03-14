import { InMemorySigner } from "@taquito/signer";
import * as TaquitoUtils from "@taquito/utils";

import * as Ed25519 from "ed25519-hd-key";

export async function getPublicKey(privateKey: string) {
  const signer = await createMemorySigner(privateKey);
  return signer.publicKey();
}

async function createMemorySigner(privateKey: string, encPassword?: string) {
  return InMemorySigner.fromSecretKey(privateKey, encPassword);
}

export function seedToHDPrivateKey(seed: Uint8Array, hdAccIndex: number) {
  return seedToPrivateKey(deriveSeed(seed, getMainDerivationPath(hdAccIndex)));
}

function seedToPrivateKey(seed: Buffer<ArrayBufferLike>) {
  return TaquitoUtils.b58cencode(seed.subarray(0, 32), TaquitoUtils.prefix.edsk2);
}

function deriveSeed(seed: Uint8Array, derivationPath: string) {
  try {
    const { key } = Ed25519.derivePath(derivationPath, uint8ArrayToHex(seed));
    return key;
  } catch (_err) {
    throw new Error("Invalid derivation path");
  }
}

const TEZOS_BIP44_COINTYPE = 1_729;

function getMainDerivationPath(accIndex: number) {
  return `m/44'/${TEZOS_BIP44_COINTYPE}'/${accIndex}'/0'`;
}

function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
