import { constants } from "node:fs";
import {
  access,
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, posix, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

import JSZip from "jszip";

import { moduleImportErrorMessages } from "@/features/_core/module-error-messages";
import { ActionError } from "@/lib/errors/action-error";
import type { ProjectModuleManifest } from "./types";

export const maxModuleArchiveBytes = 25 * 1024 * 1024;
const maxExpandedModuleArchiveBytes = 100 * 1024 * 1024;
const maxModuleArchiveEntries = 10_000;

export function getModuleSourceRoots() {
  return [
    resolve(process.cwd(), ".private-modules"),
    resolve(process.cwd(), "src/features/modules"),
  ];
}

export async function resolveModuleSourceDirectory(key: string) {
  for (const modulesRoot of getModuleSourceRoots()) {
    const moduleDirectory = resolve(modulesRoot, key);
    if (!moduleDirectory.startsWith(`${modulesRoot}${sep}`)) {
      continue;
    }
    try {
      await access(moduleDirectory, constants.R_OK);
      return { modulesRoot, moduleDirectory };
    } catch {
      continue;
    }
  }
  throw new ActionError("NOT_FOUND", "Module source directory not found");
}

async function addDirectoryToArchive(
  archive: JSZip,
  directory: string,
  relativeDirectory = "",
) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = resolve(directory, entry.name);
      const relativePath = relativeDirectory
        ? posix.join(relativeDirectory, entry.name)
        : entry.name;
      const stats = await lstat(absolutePath);

      if (stats.isSymbolicLink()) {
        throw new ActionError(
          "VALIDATION",
          `${moduleImportErrorMessages.invalidPath}: ${relativePath}`,
        );
      }

      if (stats.isDirectory()) {
        archive.file(`${relativePath}/`, null, {
          dir: true,
          date: stats.mtime,
          unixPermissions: stats.mode,
        });
        await addDirectoryToArchive(archive, absolutePath, relativePath);
        return;
      }

      if (!stats.isFile()) {
        throw new ActionError(
          "VALIDATION",
          `${moduleImportErrorMessages.invalidPath}: ${relativePath}`,
        );
      }

      archive.file(relativePath, await readFile(absolutePath), {
        date: stats.mtime,
        unixPermissions: stats.mode,
      });
    }),
  );
}

export async function createModuleSourceArchive(key: string) {
  const { moduleDirectory } = await resolveModuleSourceDirectory(key);

  const archive = new JSZip();
  await addDirectoryToArchive(archive, moduleDirectory);
  return archive.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    platform: "UNIX",
  });
}

function getExpandedSize(entry: JSZip.JSZipObject) {
  const internal = entry as JSZip.JSZipObject & {
    _data?: { uncompressedSize?: unknown };
  };
  return typeof internal._data?.uncompressedSize === "number"
    ? internal._data.uncompressedSize
    : null;
}

function validateEntryName(name: string) {
  const path = name.replace(/\/$/, "");
  if (
    !path ||
    name.includes("\\") ||
    name.includes("\0") ||
    name.startsWith("/") ||
    path
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new ActionError("VALIDATION", moduleImportErrorMessages.invalidPath);
  }
}

export async function loadModuleSourceArchive(data: ArrayBuffer) {
  const archive = await JSZip.loadAsync(data).catch(() => {
    throw new ActionError(
      "VALIDATION",
      moduleImportErrorMessages.invalidArchive,
    );
  });
  const entries = Object.values(archive.files);
  if (entries.length === 0) {
    throw new ActionError("VALIDATION", moduleImportErrorMessages.emptyArchive);
  }
  if (entries.length > maxModuleArchiveEntries) {
    throw new ActionError("VALIDATION", moduleImportErrorMessages.tooManyFiles);
  }

  let expandedSize = 0;
  for (const entry of entries) {
    validateEntryName(entry.unsafeOriginalName ?? entry.name);
    if (entry.dir) continue;
    const size = getExpandedSize(entry);
    if (size === null) {
      throw new ActionError(
        "VALIDATION",
        moduleImportErrorMessages.unavailableSize,
      );
    }
    expandedSize += size;
  }
  if (expandedSize > maxExpandedModuleArchiveBytes) {
    throw new ActionError("VALIDATION", moduleImportErrorMessages.tooLarge);
  }
  if (!archive.file("module.json")) {
    throw new ActionError(
      "VALIDATION",
      moduleImportErrorMessages.missingManifest,
    );
  }
  return archive;
}

function getEntryPermissions(entry: JSZip.JSZipObject) {
  return typeof entry.unixPermissions === "number"
    ? entry.unixPermissions & 0o777
    : null;
}

export async function importModuleSourceArchive(
  archive: JSZip,
  manifest: ProjectModuleManifest,
  overwrite = false,
) {
  const modulesRoot = manifest.isPrivate
    ? resolve(process.cwd(), ".private-modules")
    : resolve(process.cwd(), "src/features/modules");
  const moduleDirectory = resolve(modulesRoot, manifest.key);
  const stagingDirectory = resolve(
    modulesRoot,
    `.importing-${manifest.key}-${randomUUID()}`,
  );

  let existingModuleDirectory: string | null = null;
  let existingModulesRoot: string | null = null;
  for (const candidateRoot of getModuleSourceRoots()) {
    const candidateDirectory = resolve(candidateRoot, manifest.key);
    const exists = await access(candidateDirectory).then(
      () => true,
      () => false,
    );
    if (exists) {
      existingModuleDirectory = candidateDirectory;
      existingModulesRoot = candidateRoot;
      break;
    }
  }

  if (existingModuleDirectory && !overwrite) {
    throw new ActionError("CONFLICT", `Module already exists: ${manifest.key}`);
  }

  const replacingDirectory = resolve(
    existingModulesRoot ?? modulesRoot,
    `.replacing-${manifest.key}-${randomUUID()}`,
  );

  await mkdir(modulesRoot, { recursive: true });
  await mkdir(stagingDirectory, { recursive: false });

  try {
    const entries = Object.values(archive.files).toSorted((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      const relativePath = entry.name.replace(/\/$/, "");
      if (!relativePath) continue;
      const targetPath = resolve(stagingDirectory, relativePath);
      if (!targetPath.startsWith(`${stagingDirectory}${sep}`)) {
        throw new ActionError(
          "VALIDATION",
          moduleImportErrorMessages.invalidPath,
        );
      }

      if (entry.dir) {
        await mkdir(targetPath, { recursive: true });
      } else {
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, await entry.async("nodebuffer"), {
          flag: "wx",
        });
      }

      const permissions = getEntryPermissions(entry);
      if (permissions !== null) await chmod(targetPath, permissions);
    }

    if (existingModuleDirectory) {
      await rename(existingModuleDirectory, replacingDirectory);
    }
    await rename(stagingDirectory, moduleDirectory);
    if (existingModuleDirectory) {
      await rm(replacingDirectory, { recursive: true, force: true });
    }
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    const hasReplacement = await access(replacingDirectory).then(
      () => true,
      () => false,
    );
    if (hasReplacement) {
      await rm(moduleDirectory, { recursive: true, force: true }).catch(
        () => undefined,
      );
      await rename(replacingDirectory, moduleDirectory).catch(() => undefined);
    }
    throw error;
  }
}
