import "server-only";

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function regenerateModuleRegistries() {
  const moduleUrl = pathToFileURL(
    resolve(process.cwd(), "scripts/modules/sync-module-paths.mjs"),
  ).href;
  const { syncModulePaths } = (await import(moduleUrl)) as {
    syncModulePaths: () => void;
  };
  syncModulePaths();
}
