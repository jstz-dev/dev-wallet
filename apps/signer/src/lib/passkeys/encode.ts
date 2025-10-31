import bs58 from "bs58";
import * as cbor from "cbor";

/**
 * Convert a COSE-encoded (CBOR) public key (EC2) to a raw uncompressed public key. Returns a
 * base64-encoded string of the raw key: 0x04 || X || Y
 *
 * Supports COSE key maps with numeric keys (per RFC8152): -2: x-coordinate (byte string) -3:
 * y-coordinate (byte string) 1: kty (should be 2 for EC2)
 *
 * If input is already a raw key, it will be returned as base64.
 */
export function coseToRaw(buffer: ArrayBuffer | Uint8Array | Buffer | string) {
  // Try decode as CBOR COSE key
  const decoded = cbor.decodeAllSync(buffer)[0] as
    | Map<number, Uint8Array>
    | Record<string, Uint8Array>
    | null;

  // decoded may be a Map (with numeric keys) or an object
  let x: Uint8Array | undefined;
  let y: Uint8Array | undefined;

  if (decoded instanceof Map) {
    const xb = decoded.get(-2);
    const yb = decoded.get(-3);
    if (xb) x = xb;
    if (yb) y = xb;
  } else if (decoded !== null && typeof decoded === "object") {
    // some decoders return object with string keys
    x = decoded["-2"] ? decoded["-2"] : decoded.x ? decoded.x : undefined;
    y = decoded["-3"] ? decoded["-3"] : decoded.y ? decoded.y : undefined;
  }

  if (!x || !y) {
    throw new TypeError("Could not find x/y coordinates when decoding COSE key");
  }

  if (x.length !== y.length) {
    // still proceed but warn
    // pad shorter to match (unlikely for valid keys)
    const len = Math.max(x.length, y.length);
    const xPad = Buffer.alloc(len);
    const yPad = Buffer.alloc(len);
    Buffer.from(x).copy(xPad, len - x.length);
    Buffer.from(y).copy(yPad, len - y.length);
    x = xPad;
    y = yPad;
  }

  const raw = Buffer.concat([Buffer.from([0x04]), x, y]);
  return new Uint8Array(raw);
}

/** Parse a COSE-encoded CBOR public key to a base58 string of the raw uncompressed key. */
export async function parseKey(buffer: ArrayBuffer | Uint8Array | Buffer | string) {
  const rawKey = coseToRaw(buffer);
  const compressedKey = compressPublicKey(rawKey);

  // payload = prefix + compressedKey
  const payload = new Uint8Array(compressedKey.length + 4);
  payload.set([3, 178, 139, 127], 0);
  payload.set(compressedKey, 4);

  const checksum1 = await crypto.subtle.digest("SHA-256", payload);
  const checksum2 = new Uint8Array(await crypto.subtle.digest("SHA-256", checksum1));

  // result = payload + checksum
  const result = new Uint8Array(payload.length + 4);
  result.set(payload, 0);
  result.set(checksum2.slice(0, 4), payload.length);

  // scheme: p2pk + base58(key + sha256(sha256(key))[..4])
  return bs58.encode(result);
}

function compressPublicKey(rawKey: Uint8Array) {
  if (rawKey.length !== 65 || rawKey[0] !== 0x04) {
    throw new Error("Expected uncompressed P-256 key");
  }

  const x = rawKey.slice(1, 33);
  const y = rawKey.slice(33, 65);

  // Check parity of Y (last byte determines even/odd)

  // We're checking above if y[y.length - 1] exists
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const yIsOdd = (y[y.length - 1]! & 1) === 1;
  const prefix = yIsOdd ? 0x03 : 0x02;

  const compressed = new Uint8Array(33);
  compressed[0] = prefix;
  compressed.set(x, 1);

  return compressed;
}
