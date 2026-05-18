import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY no configurada");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes)");
  return key;
}

/** Cifra texto plano → Buffer (IV + TAG + ciphertext) */
export function encrypt(plaintext: string): Buffer {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

/** Descifra Buffer → texto plano */
export function decrypt(data: Buffer): string {
  const key = getKey();
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Helpers para campos opcionales */
export function encryptOptional(value: string | null | undefined): Buffer | null {
  if (value == null || value === "") return null;
  return encrypt(value);
}

export function decryptOptional(data: Buffer | null | undefined): string | null {
  if (data == null) return null;
  return decrypt(data);
}
