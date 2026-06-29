import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { readModuleManifest } from "@/features/modules/_core/registry";
import { createModuleSourceArchive } from "@/features/modules/_core/source-archive";
import { isActionError } from "@/lib/errors/action-error";
import { requireProjectManageAccess } from "@/lib/projects/access";

type ExportRequest = {
  key?: unknown;
  projectId?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest;
    if (typeof body.key !== "string" || typeof body.projectId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await requireProjectManageAccess(body.projectId);
    const manifest = readModuleManifest(body.key);
    if (!manifest) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const buffer = await createModuleSourceArchive(manifest.key);
    const responseBody = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${manifest.key}-v${manifest.version}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (isActionError(error)) {
      const status = error.code === "FORBIDDEN" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 },
    );
  }
}
