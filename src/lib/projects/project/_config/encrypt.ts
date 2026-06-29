const ALGORITHM = "AES-GCM";
const SALT = new TextEncoder().encode("infologist-project-config-v1");

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const secret = process.env.CONFIG_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("CONFIG_ENCRYPTION_KEY or AUTH_SECRET is not set");
  }

  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  cachedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return cachedKey;
}

export async function encryptValue(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.byteLength);

  return Buffer.from(combined).toString("base64");
}

export async function decryptValue(ciphertext: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(ciphertext, "base64");
  const iv = combined.subarray(0, 12);
  const data = combined.subarray(12);
  const plain = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);
  return new TextDecoder().decode(plain);
}
