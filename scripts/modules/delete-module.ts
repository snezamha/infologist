import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";
import { webcrypto } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });
loadEnv();

const ROOT = resolve(import.meta.dirname, "..", "..");
const SRC = resolve(ROOT, "src");

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1]) {
      result[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return result;
}

const salt = new TextEncoder().encode("infologist-project-config-v1");

async function getCryptoKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const raw = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptValue(ciphertext: string): Promise<string | null> {
  try {
    const key = await getCryptoKey();
    const combined = Buffer.from(ciphertext, "base64");
    const iv = combined.subarray(0, 12);
    const data = combined.subarray(12);
    const plain = await webcrypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

async function getProjectDatabaseUrl(
  rawConfig: unknown,
): Promise<string | null> {
  const config =
    rawConfig && typeof rawConfig === "object"
      ? (rawConfig as Record<string, unknown>)
      : {};
  const encrypted = config.databaseUrl;
  if (!encrypted || typeof encrypted !== "string") return null;
  return decryptValue(encrypted);
}

async function dropModuleTables(
  databaseUrl: string,
  tables: string[],
  moduleKey: string,
) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(databaseUrl);
  for (const table of tables) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
      throw new Error(`Invalid module table: ${table}`);
    }
    await sql`DROP TABLE IF EXISTS ${sql.unsafe(`"${table}"`)} CASCADE`;
    console.log(`  dropped table: ${table}`);
  }

  const promptTables = await sql`
    SELECT to_regclass('public.prompt_templates') AS table_name
  `;
  if (promptTables[0]?.table_name) {
    await sql`
      DELETE FROM prompt_templates
      WHERE type = 'module' AND name LIKE ${`${moduleKey}/%`}
    `;
  }
}

const { key } = parseArgs();

if (!key) {
  console.error("Error: --key is required");
  console.error(
    "Usage: node --experimental-strip-types scripts/modules/delete-module.ts --key example-module",
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(key)) {
  console.error("Error: --key must be lowercase kebab-case");
  process.exit(1);
}

const modulesDir = resolve(SRC, "features/modules");
const moduleDir = resolve(modulesDir, key);
if (!moduleDir.startsWith(`${modulesDir}${sep}`)) {
  console.error("Error: invalid module path");
  process.exit(1);
}
if (!existsSync(moduleDir)) {
  console.error(`Error: module not found at ${moduleDir}`);
  process.exit(1);
}

const moduleJsonPath = resolve(moduleDir, "module.json");
if (!existsSync(moduleJsonPath)) {
  console.error(`Error: module.json not found at ${moduleJsonPath}`);
  process.exit(1);
}

const moduleJson = JSON.parse(readFileSync(moduleJsonPath, "utf8")) as {
  dbTables?: string[];
};
const dbTables: string[] = Array.isArray(moduleJson.dbTables)
  ? moduleJson.dbTables
  : [];
const dependents = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== key)
  .flatMap((entry) => {
    const manifestPath = resolve(modulesDir, entry.name, "module.json");
    if (!existsSync(manifestPath)) return [];
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      dependencies?: unknown;
    };
    return Array.isArray(manifest.dependencies) &&
      manifest.dependencies.includes(key)
      ? [entry.name]
      : [];
  });

if (dependents.length > 0) {
  console.error(`Delete dependent modules first: ${dependents.join(", ")}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Error: DATABASE_URL is not set. Copy .env.example to .env.local.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

console.log(`\nDeleting module: ${key}`);
console.log("─".repeat(50));

try {
  const records = await prisma.projectModule.findMany({
    where: { key },
    select: { projectId: true },
  });

  console.log(
    `\n[1/4] Found ${records.length} project(s) with this module installed`,
  );

  console.log(`\n[2/4] Cleaning module data from project databases`);

  const installedProjectIds = new Set(
    records.map((record) => record.projectId),
  );
  const projects = await prisma.project.findMany({
    where: { id: { in: [...installedProjectIds] } },
    select: { id: true, publicId: true, config: true },
  });

  for (const project of projects) {
    const databaseUrl = await getProjectDatabaseUrl(project.config);
    if (!databaseUrl) {
      if (!installedProjectIds.has(project.id)) continue;
      throw new Error(
        `Project database is not configured: ${project.publicId}`,
      );
    }
    try {
      await dropModuleTables(databaseUrl, dbTables, key);
      console.log(`  cleaned ${project.publicId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  failed  ${project.publicId}: ${msg}`);
      throw error;
    }
  }

  console.log(`\n[3/4] Removing ProjectModule records`);
  const { count } = await prisma.projectModule.deleteMany({ where: { key } });
  console.log(`  deleted ${count} record(s)`);

  console.log(`\n[4/4] Deleting ${moduleDir}`);
  rmSync(moduleDir, { recursive: true, force: true });
  console.log(`  deleted`);

  console.log(`\n[5/5] Clearing build cache`);
  const nextCacheDir = resolve(ROOT, ".next");
  if (existsSync(nextCacheDir)) {
    rmSync(nextCacheDir, { recursive: true, force: true });
    console.log(`  cleared .next cache`);
  }

  console.log(`\n✓ Module "${key}" has been deleted.`);
  console.log(
    "  Restart your dev server (or run next build) to apply changes.\n",
  );
} finally {
  await prisma.$disconnect();
}
