import { NextResponse } from "next/server";
import JSZip from "jszip";

import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { readModuleManifest } from "@/features/modules/_core/registry";
import { exportModuleData } from "@/features/modules/_core/module-data";
import { getProjectModuleState } from "@/lib/projects/modules";

type Params = Promise<{
  domainId: string;
  moduleKey: string;
}>;

export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const { domainId, moduleKey } = await params;

    const project = await getPublicProject(domainId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const user = await getProjectSession(project.id, domainId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manifest = readModuleManifest(moduleKey);
    if (!manifest) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const state = await getProjectModuleState(project.id, moduleKey);
    if (!state?.enabled) {
      return NextResponse.json(
        { error: "Module is not active" },
        { status: 409 },
      );
    }

    const config = await getProjectConfig(project.id);
    if (manifest.dbTables.length > 0 && !config?.databaseUrl) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 400 },
      );
    }

    const snapshot = await exportModuleData(
      config?.databaseUrl ?? null,
      manifest.dbTables,
      manifest.version,
    );

    const archive = new JSZip();
    archive.file("manifest.json", JSON.stringify(manifest, null, 2));
    archive.file("module-data.json", JSON.stringify(snapshot, null, 2));

    const buffer = await archive.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `${manifest.key}-v${manifest.version}.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Export failed",
      },
      { status: 500 },
    );
  }
}
