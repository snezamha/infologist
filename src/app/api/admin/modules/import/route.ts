import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { parseProjectModuleManifest } from "@/features/modules/_core/registry";
import { moduleImportErrorMessages } from "@/features/_core/module-error-messages";
import {
  importModuleSourceArchive,
  loadModuleSourceArchive,
  maxModuleArchiveBytes,
} from "@/features/modules/_core/source-archive";
import { ActionError, isActionError } from "@/lib/errors/action-error";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import {
  areProductionModuleDeploymentsEnabled,
  createModuleDeployment,
} from "@/lib/module-deployments/store";
import { getPrisma } from "@/lib/prisma";
import { requireProjectManageAccess } from "@/lib/projects/access";
import { regenerateModuleRegistries } from "@/features/modules/_core/sync-registries";
import { addModulePackages } from "@/lib/projects/module-packages";
import { listProjectModulesForProject } from "@/lib/projects/modules";

function parseArchiveJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ActionError("VALIDATION", "Archive contains invalid JSON");
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");
    const overwrite = formData.get("overwrite") === "true";

    if (!(file instanceof File) || typeof projectId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await requireProjectManageAccess(projectId);
    if (file.size === 0 || file.size > maxModuleArchiveBytes) {
      return NextResponse.json(
        { error: moduleImportErrorMessages.tooLargeRequest },
        { status: 413 },
      );
    }

    const archiveArrayBuffer = await file.arrayBuffer();
    const archiveBuffer = Buffer.from(archiveArrayBuffer);
    const archive = await loadModuleSourceArchive(archiveArrayBuffer);
    const manifestEntry = archive.file("module.json")!;
    const manifestText = await manifestEntry.async("string");
    const importedManifest = parseProjectModuleManifest(
      parseArchiveJson(manifestText),
    );
    if (!importedManifest) {
      throw new ActionError(
        "VALIDATION",
        moduleImportErrorMessages.invalidManifest,
      );
    }

    const currentModules = await listProjectModulesForProject(projectId);
    const existingModule = currentModules.find(
      (m) => m.key === importedManifest.key,
    );

    if (existingModule && !overwrite) {
      return NextResponse.json(
        {
          conflict: true,
          existingVersion: existingModule.version,
          newVersion: importedManifest.version,
        },
        { status: 409 },
      );
    }

    if (areProductionModuleDeploymentsEnabled()) {
      await requireSuperAdmin();
      if (existingModule) {
        const activeInstallations = await getPrisma().projectModule.count({
          where: { key: importedManifest.key, enabled: true },
        });
        if (activeInstallations > 0) {
          throw new ActionError(
            "CONFLICT",
            "Deactivate this module in every project before replacing it",
          );
        }
      }
      const deployment = await createModuleDeployment(
        "import",
        importedManifest.key,
        archiveBuffer,
      );
      return NextResponse.json({
        success: true,
        deploymentId: deployment.id,
        key: importedManifest.key,
      });
    }

    if (
      importedManifest.packageDependencies &&
      importedManifest.packageDependencies.length > 0
    ) {
      await addModulePackages(importedManifest.packageDependencies);
    }

    await importModuleSourceArchive(archive, importedManifest, overwrite);
    await regenerateModuleRegistries();
    const updatedModules = await listProjectModulesForProject(projectId);

    return NextResponse.json({
      success: true,
      key: importedManifest.key,
      modules: updatedModules.toSorted((left, right) =>
        left.key.localeCompare(right.key),
      ),
    });
  } catch (error) {
    unstable_rethrow(error);
    if (isActionError(error)) {
      const status =
        error.code === "FORBIDDEN"
          ? 403
          : error.code === "UNAUTHORIZED"
            ? 401
            : error.code === "UNAVAILABLE" || error.code === "CONFLICT"
              ? 409
              : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 },
    );
  }
}
