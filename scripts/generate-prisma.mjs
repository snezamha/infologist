#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PRIVATE_MODULES_DIR = join(ROOT, ".private-modules");
const MAIN_SCHEMA = "prisma/schema.prisma";

async function canGenerateSchema(schema) {
  try {
    const content = await readFile(schema, "utf8");
    return (
      /\bgenerator\s+\w+\s*\{/.test(content) &&
      /\bdatasource\s+\w+\s*\{/.test(content)
    );
  } catch {
    return false;
  }
}

async function getPrivateModuleSchemas() {
  try {
    const entries = await readdir(PRIVATE_MODULES_DIR, { withFileTypes: true });
    const modules = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
        .map(async (entry) => {
          const moduleDir = join(PRIVATE_MODULES_DIR, entry.name);
          const manifestPath = join(moduleDir, "module.json");
          const schemaPath = join(moduleDir, "prisma", "schema.prisma");
          const schema = relative(ROOT, schemaPath);

          try {
            await access(schemaPath);
            const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
            return {
              name:
                typeof manifest.key === "string" ? manifest.key : entry.name,
              schema,
            };
          } catch {
            return null;
          }
        }),
    );

    return modules.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function generatePrismaClient(schema) {
  const args = schema
    ? ["prisma", "generate", `--schema=${schema}`]
    : ["prisma", "generate"];
  execFileSync("npx", args, { cwd: ROOT, stdio: "inherit" });
}

try {
  const schemas = [
    { name: "main", schema: MAIN_SCHEMA },
    ...(await getPrivateModuleSchemas()),
  ];

  for (const { name, schema } of schemas) {
    if (name !== "main" && !(await canGenerateSchema(schema))) {
      await access(schema).catch(() => undefined);
      console.log(`Skipping ${name} Prisma client generation`);
      continue;
    }

    console.log(`Generating ${name} Prisma client...`);
    if (name === "main") {
      generatePrismaClient();
    } else {
      generatePrismaClient(schema);
    }
  }

  console.log("✓ All Prisma clients generated successfully");
} catch (error) {
  console.error("Failed to generate Prisma clients:", error);
  process.exit(1);
}
