import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type ModuleDeploymentOperation = "import" | "delete";
type ModuleDeploymentStatus =
  | "queued"
  | "staging"
  | "building"
  | "deploying"
  | "health_check"
  | "rolling_back"
  | "succeeded"
  | "failed";

export type ModuleDeployment = {
  id: string;
  operation: ModuleDeploymentOperation;
  moduleKey: string;
  status: ModuleDeploymentStatus;
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

function getDeploymentsDirectory() {
  return (
    process.env.MODULE_DEPLOYMENTS_DIR ??
    path.join(process.cwd(), ".module-deployments")
  );
}

function getDeploymentPath(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return path.join(getDeploymentsDirectory(), `${id}.json`);
}

async function writeDeployment(deployment: ModuleDeployment) {
  const directory = getDeploymentsDirectory();
  await mkdir(directory, { recursive: true });
  const destination = path.join(directory, `${deployment.id}.json`);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(deployment), "utf8");
  await rename(temporary, destination);
}

export async function createModuleDeployment(
  operation: ModuleDeploymentOperation,
  moduleKey: string,
  archive?: Buffer,
) {
  const now = new Date().toISOString();
  const deployment: ModuleDeployment = {
    id: randomUUID(),
    operation,
    moduleKey,
    status: "queued",
    progress: 5,
    createdAt: now,
    updatedAt: now,
  };

  await writeDeployment(deployment);
  if (archive) {
    await writeFile(
      path.join(getDeploymentsDirectory(), `${deployment.id}.zip`),
      archive,
    );
  }
  return deployment;
}

export async function getModuleDeployment(id: string) {
  const deploymentPath = getDeploymentPath(id);
  if (!deploymentPath) return null;
  try {
    return JSON.parse(
      await readFile(deploymentPath, "utf8"),
    ) as ModuleDeployment;
  } catch {
    return null;
  }
}

export function areProductionModuleDeploymentsEnabled() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.MODULE_DEPLOYMENTS_DIR)
  );
}
