import bs58 from "bs58";
import * as cbor from "cbor";

/**
 * Helper for concatenating `Uint8Arrays`
 *
 * @param {Uint8Array[]} arrays
 */
export function concatUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Convert a COSE-encoded (CBOR) public key (EC2) to a raw uncompressed public key. Returns a
 * base64-encoded string of the raw key: 0x04 || X || Y
 *
 * Supports COSE key maps with numeric keys (per RFC8152): -2: x-coordinate (byte string) -3:
 * y-coordinate (byte string) 1: kty (should be 2 for EC2)
 *
 * If input is already a raw key, it will be returned as base64.
 *
 * @param {Uint8Array[]} buffer
 */
export function coseToRaw(buffer) {
  // Try decode as CBOR COSE key
  const decoded = /** @type {Map<number, Uint8Array> | Record<string, Uint8Array> | null} */ (
    cbor.decodeAllSync(buffer)[0]
  );

  // decoded may be a Map (with numeric keys) or an object
  /** @type {Uint8Array | undefined} */
  let x;
  /** @type {Uint8Array | undefined} */
  let y;

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

  const xArr = new Uint8Array(x);
  const yArr = new Uint8Array(y);

  if (xArr.length !== yArr.length) {
    // still proceed but warn
    // pad shorter to match (unlikely for valid keys)
    const len = Math.max(xArr.length, yArr.length);

    const xPad = new Uint8Array(len);
    const yPad = new Uint8Array(len);

    xPad.set(xArr, len - xArr.length);
    yPad.set(yArr, len - yArr.length);

    x = xPad;
    y = yPad;
  } else {
    x = xArr;
    y = yArr;
  }

  return concatUint8Arrays([new Uint8Array([0x04]), x, y]);
}

/**
 * Parse a COSE-encoded CBOR public key to a base58 string of the raw uncompressed key.
 *
 * @param {ArrayBuffer | Uint8Array | string} buffer
 */
export async function parseKey(buffer) {
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

/** @param {Uint8Array} rawKey */
function compressPublicKey(rawKey) {
  if (rawKey.length !== 65 || rawKey[0] !== 0x04) {
    throw new Error("Expected uncompressed P-256 key");
  }

  const x = rawKey.slice(1, 33);
  const y = rawKey.slice(33, 65);

  // Check parity of Y (last byte determines even/odd)

  // We're checking above if y[y.length - 1] exists
  // @ts-ignore
  const yIsOdd = (y[y.length - 1] & 1) === 1;
  const prefix = yIsOdd ? 0x03 : 0x02;

  const compressed = new Uint8Array(33);
  compressed[0] = prefix;
  compressed.set(x, 1);

  return compressed;
}
