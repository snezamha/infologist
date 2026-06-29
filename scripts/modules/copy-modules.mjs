import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const STANDALONE_SRC = resolve(ROOT, ".next/standalone/src/features/modules");
const SOURCE_SRC = resolve(ROOT, "src/features/modules");
const PRIVATE_MODULES_SRC = resolve(ROOT, ".private-modules");
const STANDALONE_PRIVATE = resolve(ROOT, ".next/standalone/.private-modules");

function getModuleNames(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

const publicModules = getModuleNames(SOURCE_SRC);
const privateModules = getModuleNames(PRIVATE_MODULES_SRC);

console.log("Copying module directories to standalone build...");

mkdirSync(STANDALONE_SRC, { recursive: true });
for (const moduleName of publicModules) {
  const source = resolve(SOURCE_SRC, moduleName);
  const dest = resolve(STANDALONE_SRC, moduleName);
  try {
    cpSync(source, dest, { recursive: true, force: true });
    console.log(`  ✓ ${moduleName} (public)`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`  ○ ${moduleName} (not found, skipped)`);
    } else {
      console.error(`  ✗ ${moduleName}:`, error.message);
      process.exit(1);
    }
  }
}

mkdirSync(STANDALONE_PRIVATE, { recursive: true });
for (const moduleName of privateModules) {
  const source = resolve(PRIVATE_MODULES_SRC, moduleName);
  const dest = resolve(STANDALONE_PRIVATE, moduleName);
  try {
    cpSync(source, dest, { recursive: true, force: true });
    console.log(`  ✓ ${moduleName} (private)`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`  ○ ${moduleName} (not found, skipped)`);
    } else {
      console.error(`  ✗ ${moduleName}:`, error.message);
      process.exit(1);
    }
  }
}

console.log("✅ Module directories copied successfully");
