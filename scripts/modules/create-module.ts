import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const SRC = resolve(ROOT, "src");

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function toPascalCase(kebab: string): string {
  const camel = toCamelCase(kebab);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

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

function generateModuleJson(
  key: string,
  titleEn: string,
  titleFa: string,
  titleDe: string,
  descEn: string,
  descFa: string,
  descDe: string,
  isPrivate: boolean,
): string {
  const manifest: Record<string, unknown> = {
    key,
    type: "module",
    version: "1.0.0",
    title: { en: titleEn, fa: titleFa, de: titleDe },
    description: { en: descEn, fa: descFa, de: descDe },
    widget: false,
    dbTables: [],
    dependencies: [],
  };

  if (isPrivate) {
    manifest.isPrivate = true;
  }

  return JSON.stringify(manifest, null, 2) + "\n";
}

function generateIndexTs(pascal: string): string {
  return `export { migrate${pascal}, cleanup${pascal} } from "./db/migrations";
`;
}

function generateFrontendTsx(pascal: string, key: string): string {
  return `import { getTranslations } from "next-intl/server";
import type { ProjectModuleFrontendComponent } from "@/features/modules/_core/frontend";

const ${pascal}Frontend: ProjectModuleFrontendComponent = async ({ locale }) => {
  const t = await getTranslations({ locale, namespace: "${key}" });
  return (
    <div className="p-8 text-center text-muted-foreground">
      {t("empty")}
    </div>
  );
};

export default ${pascal}Frontend;
`;
}

function generateServerTsx(pascal: string): string {
  return `import "server-only";

import {
  migrate${pascal},
  cleanup${pascal},
} from "./db/migrations";
import type { ProjectModuleServerConfig } from "../_core/types";

const config: ProjectModuleServerConfig = {
  database: {
    migrate: migrate${pascal},
    cleanup: cleanup${pascal},
  },
};

export default config;
`;
}

function generateMigrationsTs(pascal: string): string {
  return `import { runProjectModuleMigrations } from "@/features/modules/_core/migrations";

const migrations: {
  version: string;
  up: (databaseUrl: string) => Promise<void>;
}[] = [];

export async function migrate${pascal}(
  databaseUrl: string,
  installedVersion: string | null,
): Promise<void> {
  await runProjectModuleMigrations(databaseUrl, installedVersion, migrations);
}

export async function cleanup${pascal}(databaseUrl: string): Promise<void> {
  void databaseUrl;
}
`;
}

const args = parseArgs();
const key = args["key"];
const isPrivate = args["private"] === "true";

if (!key) {
  console.error("Error: --key is required");
  console.error(
    "Usage: npm run module:create -- --key my-module [--private true] ...",
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(key)) {
  console.error("Error: --key must be lowercase kebab-case (e.g. my-module)");
  process.exit(1);
}

const moduleDir = isPrivate
  ? resolve(ROOT, ".private-modules", key)
  : resolve(SRC, "features/modules", key);

if (existsSync(moduleDir)) {
  console.error(`Error: module already exists at ${moduleDir}`);
  process.exit(1);
}

const pascal = toPascalCase(key);

const titleEn = args["title-en"] ?? key;
const titleFa = args["title-fa"] ?? key;
const titleDe = args["title-de"] ?? key;
const descEn = args["desc-en"] ?? `${titleEn} module`;
const descFa = args["desc-fa"] ?? `ماژول ${titleFa}`;
const descDe = args["desc-de"] ?? `${titleDe}-Modul`;

console.log(`\nCreating ${isPrivate ? "private" : "built-in"} module: ${key}`);
console.log("─".repeat(50));

console.log(`\n[1/2] Creating ${moduleDir}`);
mkdirSync(resolve(moduleDir, "db"), { recursive: true });
mkdirSync(resolve(moduleDir, "_actions"), { recursive: true });
mkdirSync(resolve(moduleDir, "_components"), { recursive: true });
mkdirSync(resolve(moduleDir, "messages"), { recursive: true });

writeFileSync(
  resolve(moduleDir, "module.json"),
  generateModuleJson(
    key,
    titleEn,
    titleFa,
    titleDe,
    descEn,
    descFa,
    descDe,
    isPrivate,
  ),
);
writeFileSync(resolve(moduleDir, "index.ts"), generateIndexTs(pascal));
writeFileSync(
  resolve(moduleDir, "frontend.tsx"),
  generateFrontendTsx(pascal, key),
);
writeFileSync(resolve(moduleDir, "_server.tsx"), generateServerTsx(pascal));
writeFileSync(
  resolve(moduleDir, "db/migrations.ts"),
  generateMigrationsTs(pascal),
);
writeFileSync(
  resolve(moduleDir, "messages/en.json"),
  `${JSON.stringify({ empty: descEn }, null, 2)}\n`,
);
writeFileSync(
  resolve(moduleDir, "messages/fa.json"),
  `${JSON.stringify({ empty: descFa }, null, 2)}\n`,
);
writeFileSync(
  resolve(moduleDir, "messages/de.json"),
  `${JSON.stringify({ empty: descDe }, null, 2)}\n`,
);

const created = [
  "module.json",
  "index.ts",
  "frontend.tsx",
  "_server.tsx",
  "db/migrations.ts",
  "messages/en.json",
  "messages/fa.json",
  "messages/de.json",
  "_actions/  (empty)",
  "_components/  (empty)",
];
for (const f of created) console.log(`  created: ${f}`);

console.log(`\n[2/2] Clearing build cache`);
const nextCacheDir = resolve(ROOT, ".next");
if (existsSync(nextCacheDir)) {
  rmSync(nextCacheDir, { recursive: true, force: true });
  console.log(`  cleared .next cache`);
}

const modulePath = isPrivate
  ? `.private-modules/${key}`
  : `src/features/modules/${key}`;

console.log(`\n[3/3] Next steps`);
console.log(`  1. Edit ${modulePath}/module.json  — add dbTables if needed`);
console.log(`  2. Edit ${modulePath}/db/migrations.ts  — write your SQL`);
console.log(`  3. Edit ${modulePath}/frontend.tsx  — build your UI`);
console.log(
  `  4. Edit ${modulePath}/_server.tsx  — add module routes if needed`,
);
console.log(`  5. Restart your dev server (or run next build)`);
console.log(
  `\n✓ ${isPrivate ? "Private" : "Built-in"} module "${key}" scaffolded.\n`,
);
