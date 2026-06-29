import { execFileSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import type { PackageDependency } from "@/features/modules/_core/types";
import { listProjectModuleManifests } from "@/features/modules/_core/server-manifests";
import { getPrisma } from "@/lib/prisma";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

type PackageSection = "dependencies" | "devDependencies";
type PackageFilesSnapshot = {
  packageJson: string;
  packageLockJson: string | null;
};

async function readPackageJson(): Promise<PackageJson> {
  try {
    const content = await readFile("package.json", "utf-8");
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to read package.json");
  }
}

async function writePackageJson(pkg: PackageJson): Promise<void> {
  try {
    await writeFile("package.json", JSON.stringify(pkg, null, 2));
  } catch {
    throw new Error("Failed to write package.json");
  }
}

function installPackages(): void {
  execFileSync("npm", ["install"], { stdio: "inherit" });
}

async function readOptionalFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function readPackageFilesSnapshot(): Promise<PackageFilesSnapshot> {
  return {
    packageJson: await readFile("package.json", "utf-8"),
    packageLockJson: await readOptionalFile("package-lock.json"),
  };
}

async function restorePackageFiles(
  snapshot: PackageFilesSnapshot,
): Promise<void> {
  await writeFile("package.json", snapshot.packageJson);
  if (snapshot.packageLockJson !== null) {
    await writeFile("package-lock.json", snapshot.packageLockJson);
  } else {
    await rm("package-lock.json", { force: true });
  }
}

function getPackageSection(
  pkg: PackageJson,
  section: PackageSection,
): Record<string, string> | undefined {
  const value = pkg[section];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return value as Record<string, string>;
}

function ensurePackageSection(
  pkg: PackageJson,
  section: PackageSection,
): Record<string, string> {
  const existing = getPackageSection(pkg, section);
  if (existing) return existing;

  const created: Record<string, string> = {};
  pkg[section] = created;
  return created;
}

export async function addModulePackages(
  packages: PackageDependency[],
): Promise<void> {
  if (packages.length === 0) return;

  const snapshot = await readPackageFilesSnapshot();
  const pkg = await readPackageJson();
  let hasChanges = false;

  for (const dep of packages) {
    const target = dep.isDev ? "devDependencies" : "dependencies";
    const section = ensurePackageSection(pkg, target);
    if (section[dep.name] === dep.version) continue;
    section[dep.name] = dep.version;
    hasChanges = true;
  }

  if (!hasChanges) return;

  await writePackageJson(pkg);

  try {
    installPackages();
  } catch (error) {
    await restorePackageFiles(snapshot);
    throw new Error(`Failed to install npm packages: ${error}`);
  }
}

async function isPackageUsedOutsideModuleKey(
  packageName: string,
  moduleKey: string,
): Promise<boolean> {
  const moduleKeys = (await listProjectModuleManifests()).flatMap(
    (projectModule) => {
      if (projectModule.key === moduleKey) return [];
      const usesPackage = projectModule.packageDependencies?.some(
        (dep) => dep.name === packageName,
      );
      return usesPackage ? [projectModule.key] : [];
    },
  );

  if (moduleKeys.length === 0) return false;

  const activeInstallations = await getPrisma().projectModule.count({
    where: {
      enabled: true,
      key: { in: moduleKeys },
    },
  });

  return activeInstallations > 0;
}

export async function removeGlobalModulePackages(
  packages: PackageDependency[],
  moduleKey: string,
): Promise<boolean> {
  if (packages.length === 0) return false;

  const snapshot = await readPackageFilesSnapshot();
  const pkg = await readPackageJson();
  let hasChanges = false;

  for (const dep of packages) {
    const isUsedElsewhere = await isPackageUsedOutsideModuleKey(
      dep.name,
      moduleKey,
    );

    if (isUsedElsewhere) continue;

    const target = dep.isDev ? "devDependencies" : "dependencies";
    const section = getPackageSection(pkg, target);
    if (section && dep.name in section) {
      delete section[dep.name];
      hasChanges = true;
    }
  }

  if (!hasChanges) return false;

  await writePackageJson(pkg);

  try {
    installPackages();
    return true;
  } catch (error) {
    await restorePackageFiles(snapshot);
    throw new Error(`Failed to update npm packages: ${error}`);
  }
}
