"use server";

import {
  assertProjectModuleInstallable,
  installProjectModule,
  uninstallProjectModuleAction,
} from "./index";

export async function reinstallProjectModule(projectId: string, key: string) {
  await assertProjectModuleInstallable(projectId, key);
  await uninstallProjectModuleAction(projectId, key);
  return installProjectModule(projectId, key);
}
