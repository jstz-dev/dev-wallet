import bs58 from "bs58";
import { Buffer } from "buffer";
import cbor from "cbor";

/** @param {ArrayBuffer | Uint8Array | Buffer | string} input */
function toBuffer(input) {
  if (typeof input === "string") {
    // try base64 or hex
    // base64 detection: contains + or / or ends with =
    if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) {
      return Buffer.from(input, "hex");
    }

    return Buffer.from(input, "base64");
  }

  if (input instanceof Buffer) return input;
  if (input instanceof Uint8Array) return Buffer.from(input.buffer || input);
  return Buffer.from(input);
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
 * @param {ArrayBuffer | Uint8Array | Buffer | string} buffer
 */
export function coseToRaw(buffer) {
  const buf = toBuffer(buffer);

  // If it already looks like an uncompressed EC public key (0x04 prefix), return directly
  if (buf.length >= 65 && buf[0] === 0x04) return new Uint8Array(buf);

  // Try decode as CBOR COSE key
  const decoded = cbor.decodeAllSync(buf)[0];

  // decoded may be a Map (with numeric keys) or an object
  /** @type {Buffer | undefined} */
  let x;

  /** @type {Buffer | undefined} */
  let y;

  if (decoded instanceof Map) {
    const xb = decoded.get(-2);
    const yb = decoded.get(-3);
    if (xb) x = toBuffer(xb);
    if (yb) y = toBuffer(yb);
  } else if (typeof decoded === "object" && decoded !== null) {
    // some decoders return object with string keys
    x = decoded["-2"] ? toBuffer(decoded["-2"]) : decoded.x ? toBuffer(decoded.x) : undefined;
    y = decoded["-3"] ? toBuffer(decoded["-3"]) : decoded.y ? toBuffer(decoded.y) : undefined;
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
    x.copy(xPad, len - x.length);
    y.copy(yPad, len - y.length);
    x = xPad;
    y = yPad;
  }

  const raw = Buffer.concat([Buffer.from([0x04]), x, y]);
  return new Uint8Array(raw);
}

/**
 * Parse a COSE-encoded CBOR public key to a base58 string of the raw uncompressed key.
 *
 * @param {ArrayBuffer | Uint8Array | Buffer | string} buffer
 */
export async function parseKey(buffer) {
  const rawKey = coseToRaw(toBuffer(buffer));
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
  const yIsOdd = (y[y.length - 1] & 1) === 1;
  const prefix = yIsOdd ? 0x03 : 0x02;

  const compressed = new Uint8Array(33);
  compressed[0] = prefix;
  compressed.set(x, 1);

  return compressed;
}
