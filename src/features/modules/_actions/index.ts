"use server";

import { constants } from "node:fs";
import { access, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { deleteModuleTemplates } from "@/features/ai-assistant";
import { moduleActionErrorMessages } from "@/features/_core/module-error-messages";
import { compareSemanticVersions } from "@/features/modules/_core/semver";
import { isValidProjectModuleKey } from "@/features/modules/_core/registry";
import {
  listProjectModuleManifests,
  readProjectModuleManifest,
} from "@/features/modules/_core/server-manifests";
import { getProjectModuleServerDefinition } from "@/features/modules/_core/server-registry";
import type { ProjectModuleSummary } from "@/features/modules/_core/types";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { requireProjectManageAccess } from "@/lib/projects/access";
import { requireSuperAdminAction } from "@/lib/auth/rbac";
import {
  activateProjectModule,
  deactivateProjectModule,
  getProjectModuleState,
  isProjectModuleActive,
  listProjectModulesForProject,
} from "@/lib/projects/modules";
import { revalidateProjectNavigation } from "@/lib/projects/navigation-state.server";
import { resolveModuleSourceDirectory } from "@/features/modules/_core/source-archive";
import { regenerateModuleRegistries } from "@/features/modules/_core/sync-registries";
import {
  addModulePackages,
  removeGlobalModulePackages,
} from "@/lib/projects/module-packages";

async function assertProjectModuleInstallable(
  projectId: string,
  key: string,
): Promise<void> {
  const manifest = await readProjectModuleManifest(key);
  if (!manifest) {
    throw new ActionError(
      "NOT_FOUND",
      moduleActionErrorMessages.moduleNotAvailable,
    );
  }

  if (manifest.dependencies.length > 0) {
    const dependencyStates = await Promise.all(
      manifest.dependencies.map(async (dependency) => ({
        dependency,
        active: await isProjectModuleActive(projectId, dependency),
      })),
    );
    const missing = dependencyStates
      .filter(({ active }) => !active)
      .map(({ dependency }) => dependency);
    if (missing.length > 0) {
      throw new ActionError(
        "UNAVAILABLE",
        `Required modules are not installed: ${missing.join(", ")}`,
      );
    }
  }

  const state = await getProjectModuleState(projectId, key);
  if (
    state?.version &&
    compareSemanticVersions(state.version, manifest.version) > 0
  ) {
    throw new ActionError(
      "CONFLICT",
      `Cannot downgrade ${key} from ${state.version} to ${manifest.version}`,
    );
  }
}

async function migrateProjectModule(projectId: string, key: string) {
  const definition = getProjectModuleServerDefinition(key);
  if (!definition) {
    throw new ActionError(
      "UNAVAILABLE",
      moduleActionErrorMessages.moduleServerConfigUnavailable,
    );
  }

  if (!definition.database) return definition;

  const config = await getProjectConfig(projectId);
  if (!config?.databaseUrl) {
    throw new ActionError(
      "UNAVAILABLE",
      moduleActionErrorMessages.projectDatabaseNotConfigured,
    );
  }

  const state = await getProjectModuleState(projectId, key);
  await definition.database.migrate(config.databaseUrl, state?.version ?? null);
  return definition;
}

export { assertProjectModuleInstallable };

type ProjectModuleState = Awaited<ReturnType<typeof getProjectModuleState>>;

async function restoreProjectModuleState(
  projectId: string,
  key: string,
  state: ProjectModuleState,
) {
  if (!state) {
    await deactivateProjectModule(projectId, key);
    return;
  }

  if (state.enabled) {
    await activateProjectModule(projectId, key, state.version);
    return;
  }

  await deactivateProjectModule(projectId, key);
}

export async function installProjectModule(
  projectId: string,
  key: string,
): Promise<ProjectModuleSummary[]> {
  await requireProjectManageAccess(projectId);
  const previousState = await getProjectModuleState(projectId, key);
  await assertProjectModuleInstallable(projectId, key);

  const manifest = await readProjectModuleManifest(key);
  if (!manifest) {
    throw new ActionError(
      "NOT_FOUND",
      moduleActionErrorMessages.moduleNotAvailable,
    );
  }

  if (manifest.packageDependencies && manifest.packageDependencies.length > 0) {
    await addModulePackages(manifest.packageDependencies);
  }

  try {
    const definition = await migrateProjectModule(projectId, key);
    await activateProjectModule(
      projectId,
      definition.manifest.key,
      definition.manifest.version,
    );
  } catch (error) {
    await restoreProjectModuleState(projectId, manifest.key, previousState);
    throw error;
  }

  revalidateProjectNavigation(projectId);

  return listProjectModulesForProject(projectId);
}

export async function uninstallProjectModuleAction(
  projectId: string,
  key: string,
): Promise<ProjectModuleSummary[]> {
  await requireProjectManageAccess(projectId);

  const definition = getProjectModuleServerDefinition(key);
  if (!definition) {
    throw new ActionError(
      "UNAVAILABLE",
      moduleActionErrorMessages.moduleServerConfigUnavailable,
    );
  }

  const activeDependents = (
    await Promise.all(
      (await listProjectModuleManifests())
        .filter((module) => module.dependencies.includes(key))
        .map(async (module) => ({
          key: module.key,
          active: await isProjectModuleActive(projectId, module.key),
        })),
    )
  )
    .filter(({ active }) => active)
    .map(({ key: dependentKey }) => dependentKey);

  if (activeDependents.length > 0) {
    throw new ActionError(
      "CONFLICT",
      `Deactivate dependent modules first: ${activeDependents.join(", ")}`,
    );
  }

  await deactivateProjectModule(projectId, key);

  revalidateProjectNavigation(projectId);

  return listProjectModulesForProject(projectId);
}

export async function deleteProjectModuleGlobally(
  key: string,
  currentProjectId: string,
): Promise<ProjectModuleSummary[]> {
  await requireSuperAdminAction();

  if (process.env.NODE_ENV === "production") {
    throw new ActionError(
      "UNAVAILABLE",
      "Module source deletion is disabled in production",
    );
  }

  if (!isValidProjectModuleKey(key)) {
    throw new ActionError("VALIDATION", "Invalid module key");
  }

  const definition = getProjectModuleServerDefinition(key);
  if (!definition) {
    throw new ActionError(
      "UNAVAILABLE",
      moduleActionErrorMessages.moduleServerConfigUnavailable,
    );
  }

  const dependents = (await listProjectModuleManifests()).filter(
    (module) => module.key !== key && module.dependencies.includes(key),
  );
  if (dependents.length > 0) {
    throw new ActionError(
      "CONFLICT",
      `Delete dependent modules first: ${dependents.map((module) => module.key).join(", ")}`,
    );
  }

  const { modulesRoot, moduleDirectory: modulePath } =
    await resolveModuleSourceDirectory(key);

  await access(modulePath, constants.W_OK).catch(() => {
    throw new ActionError("NOT_FOUND", "Module source directory not found");
  });

  const prisma = getPrisma();
  const installations = await prisma.projectModule.findMany({
    where: { key },
    select: { projectId: true },
  });
  const installedProjectIds = new Set(
    installations.map((installation) => installation.projectId),
  );
  const projects = await prisma.project.findMany({
    where: { id: { in: [...installedProjectIds] } },
    select: { id: true, publicId: true },
  });
  const stagingPath = resolve(modulesRoot, `.deleting-${key}-${randomUUID()}`);
  const packageDependencies = definition.manifest.packageDependencies ?? [];
  let removedGlobalPackages = false;

  await rename(modulePath, stagingPath);

  try {
    const cleanupFailures: string[] = [];

    for (const project of projects) {
      try {
        const config = await getProjectConfig(project.id);
        if (!config.databaseUrl) {
          throw new ActionError(
            "UNAVAILABLE",
            moduleActionErrorMessages.projectDatabaseNotConfigured,
          );
        }

        if (definition.database) {
          await definition.database.cleanup(config.databaseUrl);
        }
        await deleteModuleTemplates(config.databaseUrl, key);
      } catch {
        cleanupFailures.push(project.publicId);
      }
    }

    if (cleanupFailures.length > 0) {
      throw new ActionError(
        "UNKNOWN",
        `Module cleanup failed for: ${cleanupFailures.join(", ")}`,
      );
    }

    if (packageDependencies.length > 0) {
      removedGlobalPackages = await removeGlobalModulePackages(
        packageDependencies,
        key,
      );
    }

    await prisma.projectModule.deleteMany({ where: { key } });
    await rm(stagingPath, { recursive: true, force: true });
    await regenerateModuleRegistries();

    for (const projectId of installedProjectIds) {
      revalidateProjectNavigation(projectId);
    }
  } catch (error) {
    if (removedGlobalPackages) {
      await addModulePackages(packageDependencies).catch(() => undefined);
    }
    await rename(stagingPath, modulePath).catch(() => undefined);
    throw error;
  }

  const result = await listProjectModulesForProject(currentProjectId);
  return result.filter((m) => m.key !== key);
}
