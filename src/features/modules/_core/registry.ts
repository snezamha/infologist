import { projectFeatureRegistry } from "@/features/_core/registry";
import { parseSemanticVersion } from "./semver";
import { generatedProjectModuleManifests } from "./generated/module-manifests";
import type {
  LocalizedModuleText,
  PackageDependency,
  ProjectModuleKey,
  ProjectModuleManifest,
} from "./types";

export type {
  LocalizedModuleText,
  ProjectModuleKey,
  ProjectModuleManifest,
  ProjectModuleSummary,
} from "./types";

const moduleKeyPattern = /^[a-z][a-z0-9-]*$/;
const dbIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isValidProjectModuleKey(
  value: unknown,
): value is ProjectModuleKey {
  return typeof value === "string" && moduleKeyPattern.test(value);
}

function isLocalizedModuleText(value: unknown): value is LocalizedModuleText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return [record.en, record.fa, record.de].every(
    (text) => typeof text === "string" && text.trim().length > 0,
  );
}

function isUnique(values: readonly string[]) {
  return new Set(values).size === values.length;
}

type PackageDependencyLike = {
  name: unknown;
  version: unknown;
  isDev?: unknown;
};

function isPackageDependency(value: unknown): value is PackageDependency {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as PackageDependencyLike;
  return (
    typeof record.name === "string" &&
    typeof record.version === "string" &&
    record.name.trim().length > 0 &&
    record.version.trim().length > 0 &&
    (record.isDev === undefined || typeof record.isDev === "boolean")
  );
}

function isValidPackageDependencies(value: unknown) {
  if (!Array.isArray(value)) return false;
  return value.every(isPackageDependency);
}

function getModuleExportValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (!("default" in value)) return value;
  return (value as { default?: unknown }).default;
}

export function parseProjectModuleManifest(
  value: unknown,
): ProjectModuleManifest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const manifest = value as Partial<ProjectModuleManifest>;
  if (
    !isValidProjectModuleKey(manifest.key) ||
    manifest.type !== "module" ||
    typeof manifest.version !== "string" ||
    !parseSemanticVersion(manifest.version) ||
    !isLocalizedModuleText(manifest.title) ||
    !isLocalizedModuleText(manifest.description) ||
    typeof manifest.widget !== "boolean" ||
    !Array.isArray(manifest.dbTables) ||
    !manifest.dbTables.every(
      (table) => typeof table === "string" && dbIdentifierPattern.test(table),
    ) ||
    !isUnique(manifest.dbTables) ||
    !Array.isArray(manifest.dependencies) ||
    !manifest.dependencies.every(isValidProjectModuleKey) ||
    !isUnique(manifest.dependencies) ||
    manifest.dependencies.includes(manifest.key) ||
    (manifest.packageDependencies !== undefined &&
      !isValidPackageDependencies(manifest.packageDependencies))
  ) {
    return null;
  }

  const result: ProjectModuleManifest = {
    key: manifest.key,
    type: "module",
    version: manifest.version,
    title: manifest.title,
    description: manifest.description,
    widget: manifest.widget,
    dbTables: [...manifest.dbTables],
    dependencies: [...manifest.dependencies],
  };

  if (manifest.isPrivate === true) {
    result.isPrivate = true;
  }

  if (manifest.packageDependencies && manifest.packageDependencies.length > 0) {
    result.packageDependencies = manifest.packageDependencies;
  }

  return result;
}

function requireManifest(value: unknown): ProjectModuleManifest {
  const manifest = parseProjectModuleManifest(value);
  if (!manifest) throw new Error("Invalid compiled module manifest");
  return manifest;
}

function validateModuleCatalog(modules: readonly ProjectModuleManifest[]) {
  const moduleMap = new Map<string, ProjectModuleManifest>();
  const tableOwners = new Map<string, string>(
    projectFeatureRegistry.flatMap((feature) =>
      feature.dbTables.map(
        (table) => [table, `feature:${feature.key}`] as const,
      ),
    ),
  );

  for (const manifest of modules) {
    if (moduleMap.has(manifest.key)) {
      throw new Error(`Duplicate module key: ${manifest.key}`);
    }
    moduleMap.set(manifest.key, manifest);

    for (const table of manifest.dbTables) {
      const owner = tableOwners.get(table);
      if (owner) {
        throw new Error(
          `Database table ${table} is declared by both ${owner} and module:${manifest.key}`,
        );
      }
      tableOwners.set(table, `module:${manifest.key}`);
    }
  }

  for (const manifest of modules) {
    for (const dependency of manifest.dependencies) {
      if (!moduleMap.has(dependency)) {
        throw new Error(
          `Module ${manifest.key} depends on unavailable module ${dependency}`,
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visiting.has(key)) {
      throw new Error(`Circular module dependency detected at ${key}`);
    }
    if (visited.has(key)) return;

    visiting.add(key);
    const manifest = moduleMap.get(key)!;
    for (const dependency of manifest.dependencies) visit(dependency);
    visiting.delete(key);
    visited.add(key);
  };

  for (const manifest of modules) visit(manifest.key);
}

type GeneratedProjectModuleManifestEntry = {
  key: string;
  isPrivate: boolean;
  manifest: unknown;
};

const compiledProjectModules = (
  generatedProjectModuleManifests as readonly GeneratedProjectModuleManifestEntry[]
)
  .map((entry) => ({
    ...requireManifest(getModuleExportValue(entry.manifest)),
    isPrivate: entry.isPrivate,
  }))
  .toSorted((left, right) => left.key.localeCompare(right.key));

validateModuleCatalog(compiledProjectModules);

const compiledProjectModuleMap = new Map(
  compiledProjectModules.map((manifest) => [manifest.key, manifest]),
);

export function readModuleManifest(
  key: ProjectModuleKey,
): ProjectModuleManifest | null {
  if (!isValidProjectModuleKey(key)) return null;
  return compiledProjectModuleMap.get(key) ?? null;
}

export function listProjectModules(): ProjectModuleManifest[] {
  return [...compiledProjectModules];
}
