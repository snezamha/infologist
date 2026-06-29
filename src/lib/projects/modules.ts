import type { ProjectModuleSummary } from "@/features/modules/_core/registry";
import { listProjectModuleManifests } from "@/features/modules/_core/server-manifests";
import { getPrisma } from "@/lib/prisma";

export async function getProjectModuleKeys(
  projectId: string,
): Promise<string[]> {
  const rows = await getPrisma().projectModule.findMany({
    where: { projectId, enabled: true },
    select: { key: true },
  });

  const compiledKeys = new Set(
    (await listProjectModuleManifests()).map((module) => module.key),
  );
  return rows.map((row) => row.key).filter((key) => compiledKeys.has(key));
}

export async function getProjectModuleState(projectId: string, key: string) {
  return getPrisma().projectModule.findUnique({
    where: { projectId_key: { projectId, key } },
    select: { enabled: true, version: true },
  });
}

export async function isProjectModuleActive(
  projectId: string,
  key: string,
): Promise<boolean> {
  const state = await getProjectModuleState(projectId, key);
  return state?.enabled === true;
}

export async function activateProjectModule(
  projectId: string,
  key: string,
  version: string | null,
): Promise<void> {
  await getPrisma().projectModule.upsert({
    where: { projectId_key: { projectId, key } },
    create: { projectId, key, enabled: true, version },
    update: { enabled: true, version },
  });
}

export async function deactivateProjectModule(
  projectId: string,
  key: string,
): Promise<void> {
  await getPrisma().projectModule.updateMany({
    where: { projectId, key },
    data: { enabled: false },
  });
}

export async function listProjectModulesForProject(
  projectId: string,
): Promise<ProjectModuleSummary[]> {
  const available = await listProjectModuleManifests();
  const states = await getPrisma().projectModule.findMany({
    where: { projectId },
    select: { key: true, enabled: true, version: true },
  });
  const stateByKey = new Map(states.map((state) => [state.key, state]));
  return available.map((module) => ({
    ...module,
    active: stateByKey.get(module.key)?.enabled === true,
    installedVersion: stateByKey.get(module.key)?.version ?? null,
  }));
}
