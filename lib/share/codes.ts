import { createHash, randomBytes } from "node:crypto";
import { SHARE_CODE_LENGTH } from "@/lib/share/constants";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function hashSource(source: string): string {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

export function byteLengthUtf8(source: string): number {
  return Buffer.byteLength(source, "utf8");
}

export function generateShareCode(): string {
  const bytes = randomBytes(SHARE_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}
