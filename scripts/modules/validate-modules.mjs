#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..", "..");
const privateModulesDir = join(projectRoot, ".private-modules");
const builtInModulesDir = join(projectRoot, "src", "features", "modules");
const mainPrismaSchemaPath = join(projectRoot, "prisma", "schema.prisma");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function listModuleManifests(root) {
  if (!existsSync(root)) return [];

  return readdirSync(root)
    .filter((entry) => {
      const fullPath = join(root, entry);
      return statSync(fullPath).isDirectory();
    })
    .flatMap((moduleName) => {
      const manifestPath = join(root, moduleName, "module.json");
      if (!existsSync(manifestPath)) return [];

      try {
        return [{ moduleName, manifest: readJson(manifestPath) }];
      } catch {
        return [];
      }
    });
}

function tableExistsInMainPrismaSchema(tableName) {
  if (!existsSync(mainPrismaSchemaPath)) return false;

  const schema = readFileSync(mainPrismaSchemaPath, "utf8");
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@@map\\(["']${escaped}["']\\)`).test(schema);
}

function validatePrivateModules() {
  const errors = [];

  if (!existsSync(privateModulesDir)) {
    return;
  }

  const privateModules = readdirSync(privateModulesDir).filter((entry) => {
    if (entry.startsWith("_")) return false;
    const fullPath = join(privateModulesDir, entry);
    return statSync(fullPath).isDirectory();
  });

  for (const moduleName of privateModules) {
    const manifestPath = join(privateModulesDir, moduleName, "module.json");

    if (!existsSync(manifestPath)) {
      errors.push(`❌ Private module "${moduleName}" missing module.json`);
      continue;
    }

    try {
      const manifest = readJson(manifestPath);

      if (!manifest.isPrivate) {
        errors.push(
          `⚠️  Private module "${moduleName}" missing "isPrivate: true" in module.json\n` +
            `   Add this field to mark it as private.`,
        );
      }
    } catch {
      errors.push(`❌ Private module "${moduleName}" has invalid module.json`);
    }
  }

  if (existsSync(builtInModulesDir)) {
    const builtInModules = readdirSync(builtInModulesDir).filter((entry) => {
      const fullPath = join(builtInModulesDir, entry);
      return statSync(fullPath).isDirectory();
    });

    for (const moduleName of builtInModules) {
      const manifestPath = join(builtInModulesDir, moduleName, "module.json");

      if (!existsSync(manifestPath)) continue;

      try {
        const manifest = readJson(manifestPath);

        if (manifest.isPrivate === true) {
          errors.push(
            `❌ Module "${moduleName}" marked as private but located in src/features/modules/\n` +
              `   Move it to .private-modules/${moduleName}/`,
          );
        }
      } catch {}
    }
  }

  for (const { moduleName, manifest } of [
    ...listModuleManifests(privateModulesDir),
    ...listModuleManifests(builtInModulesDir),
  ]) {
    const dbTables = Array.isArray(manifest.dbTables) ? manifest.dbTables : [];

    for (const tableName of dbTables) {
      if (typeof tableName !== "string") continue;
      if (!tableExistsInMainPrismaSchema(tableName)) continue;

      errors.push(
        `❌ Module "${moduleName}" table "${tableName}" is mapped in prisma/schema.prisma\n` +
          `   Module tables belong in the project database, not the main database schema.`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("\n🚨 Module Validation Errors:\n");
    errors.forEach((error) => console.error(error));
    console.error("\n");
    process.exit(1);
  }

  console.log("✅ Module validation passed");
}

const isMain = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMain) {
  validatePrivateModules();
}

export { validatePrivateModules };
