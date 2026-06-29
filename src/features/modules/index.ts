import privateProjectModules from "@infologist/private-modules";
import type { ProjectModuleFrontendComponent } from "./_core/frontend";
import type { ProjectModulePrivateSource } from "./_core/types";
import { generatedProjectModuleFrontends } from "./_core/generated/module-frontends";

export { listProjectModules } from "./_core/registry";

const installedProjectModuleFrontends: Record<
  string,
  ProjectModuleFrontendComponent
> = {};
const privateSource = privateProjectModules as ProjectModulePrivateSource;

for (const [moduleKey, frontend] of Object.entries(
  generatedProjectModuleFrontends,
)) {
  installedProjectModuleFrontends[moduleKey] =
    frontend as ProjectModuleFrontendComponent;
}

for (const [moduleKey, frontend] of Object.entries(
  privateSource.frontends ?? {},
)) {
  installedProjectModuleFrontends[moduleKey] =
    frontend as ProjectModuleFrontendComponent;
}

export { installedProjectModuleFrontends };
