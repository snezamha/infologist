import "server-only";

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import {
  listProjectModules,
  parseProjectModuleManifest,
  readModuleManifest,
} from "./registry";
import type { ProjectModuleKey, ProjectModuleManifest } from "./types";
import { getModuleSourceRoots } from "./source-archive";

async function readManifestFile(path: string) {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

async function readManifestFromRoot(root: string, key: string) {
  const manifest = parseProjectModuleManifest(
    await readManifestFile(join(root, key, "module.json")),
  );
  if (!manifest) return null;
  return {
    ...manifest,
    isPrivate: root.endsWith(".private-modules") ? true : manifest.isPrivate,
  };
}

export async function readProjectModuleManifest(
  key: ProjectModuleKey,
): Promise<ProjectModuleManifest | null> {
  const compiled = readModuleManifest(key);
  if (compiled) return compiled;

  for (const root of getModuleSourceRoots()) {
    const manifest = await readManifestFromRoot(root, key);
    if (manifest) return manifest;
  }

  return null;
}

export async function listProjectModuleManifests(): Promise<
  ProjectModuleManifest[]
> {
  const manifests = new Map(
    listProjectModules().map((manifest) => [manifest.key, manifest]),
  );

  for (const root of getModuleSourceRoots()) {
    let entries: { isDirectory(): boolean; name: string }[];
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isDirectory()) return;
        const manifest = await readManifestFromRoot(root, entry.name);
        if (manifest) manifests.set(manifest.key, manifest);
      }),
    );
  }

  return [...manifests.values()].toSorted((left, right) =>
    left.key.localeCompare(right.key),
  );
}
