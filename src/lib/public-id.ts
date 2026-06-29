import { randomInt } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function generateShortId(length = 5): string {
  return Array.from(
    { length },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
}

export function generatePublicId(prefix: string, length = 5): string {
  return `${prefix}-${generateShortId(length)}`;
}
