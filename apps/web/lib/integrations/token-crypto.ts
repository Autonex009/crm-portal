import crypto from "node:crypto";

/**
 * Symmetric encryption for OAuth tokens at rest.
 *
 * We store third-party access/refresh tokens in `integration_connections`, so
 * they must not be readable from a raw DB dump. This uses AES-256-GCM (authenticated
 * encryption): tampering with the stored blob makes decryption throw rather than
 * return corrupted plaintext.
 *
 * Node runtime only — depends on `node:crypto`. Any route importing this must
 * set `export const runtime = "nodejs"`.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce, standard for GCM
const AUTH_TAG_LENGTH = 16;
const VERSION = "v1"; // prefix so we can rotate key/algorithm later without ambiguity

/**
 * Derive a stable 32-byte key from the env secret. Hashing means any
 * `TOKEN_ENCRYPTION_KEY` of length >= 32 works (the current value is exactly 32
 * chars) without changing the storage format. Read lazily so a missing key
 * throws only when encryption is actually used, never at import time.
 */
function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypt a UTF-8 string into a `v1.<base64url>` blob safe to store in a text column. */
export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
  return `${VERSION}.${payload}`;
}

/** Reverse of {@link encryptToken}. Throws if the key is wrong or the blob was tampered with. */
export function decryptToken(payload: string): string {
  const [version, data] = payload.split(".", 2);
  if (version !== VERSION || !data) {
    throw new Error("Unrecognized token payload format");
  }
  const buf = Buffer.from(data, "base64url");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
