"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import { revalidatePath } from "next/cache";

import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import { requireProjectManageAccess } from "@/lib/projects/access";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectFeatures } from "@/features/_core/lib";
import type { MediaManagementSettings } from "@/features/_core/registry";
import {
  getProjectMediaAsset,
  getProjectMediaAssetByPublicUrl,
  getProjectMediaUsage,
  createProjectMediaAsset,
  deleteProjectMediaAsset,
  listProjectMediaAssets,
  updateProjectMediaAssetFile,
  updateProjectMediaAssetMetadata,
} from "@/lib/projects/project/_db";

const ONE_HOUR_MS = 60 * 60 * 1000;

type MediaProjectContext = {
  projectId?: string;
  domainId?: string;
  projectPublicId?: string;
};

type ResolvedMediaProject = {
  id: string;
  publicId: string;
  databaseUrl: string;
  uploadedById: string | null;
  role: "admin" | "user";
  settings: MediaManagementSettings;
};

type MediaActionContext = MediaProjectContext & {
  fileId: string;
};

function sanitizeFilename(filename: string) {
  const fallback = "upload";
  const name = basename(filename || fallback)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return name || fallback;
}

function getLocalUploadPath(publicId: string, storedFilename: string) {
  const relativePath = `uploads/projects/${publicId}/${storedFilename}`;
  const diskPath = join(process.cwd(), "public", relativePath);
  const publicUrl = `/${relativePath}`;

  return { relativePath, diskPath, publicUrl };
}

function mapMediaAsset(file: Awaited<ReturnType<typeof getProjectMediaAsset>>) {
  if (!file) return null;

  return {
    id: file.id,
    shortId: file.shortId,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    publicUrl: file.publicUrl,
    alt: file.alt,
    caption: file.caption,
    description: file.description,
    credit: file.credit,
    createdAt: file.createdAt,
  };
}

async function resolveMediaProject(
  context: MediaProjectContext,
): Promise<ResolvedMediaProject> {
  let project: {
    id: string;
    publicId: string;
  } | null = null;
  let uploadedById: string | null = null;
  let role: "admin" | "user" = "user";

  if (context.projectId) {
    const session = await requireProjectManageAccess(context.projectId);
    project = await getPrisma().project.findUnique({
      where: { id: context.projectId },
      select: { id: true, publicId: true },
    });
    uploadedById = session.user.id;
    role = "admin";
  } else if (context.domainId || context.projectPublicId) {
    const projectReference = context.domainId ?? context.projectPublicId;
    project = projectReference
      ? await getPublicProject(projectReference)
      : null;
    if (!project) throw new ActionError("NOT_FOUND", "Project not found");

    const session = await getProjectSession(project.id, projectReference ?? "");
    if (!session) throw new ActionError("UNAUTHORIZED", "Unauthorized");
    uploadedById = session.id;
    role = session.role;
  }

  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  const [config, features] = await Promise.all([
    getProjectConfig(project.id),
    getProjectFeatures(project.id),
  ]);

  if (!features.mediaManagement.enabled) {
    throw new ActionError("FORBIDDEN", "Media management is disabled");
  }

  if (!config.databaseUrl) {
    throw new ActionError("UNAVAILABLE", "Project database not configured");
  }

  return {
    id: project.id,
    publicId: project.publicId,
    databaseUrl: config.databaseUrl,
    uploadedById,
    role,
    settings: features.mediaManagement.settings,
  };
}

async function resolveMediaProjectForAsset(
  context: MediaActionContext,
): Promise<ResolvedMediaProject> {
  const project = await resolveMediaProject(context);
  const file = await getProjectMediaAsset(project.databaseUrl, context.fileId);

  if (!file) throw new ActionError("NOT_FOUND", "File not found");

  if (
    context.domainId &&
    project.role !== "admin" &&
    project.uploadedById &&
    file.uploadedById &&
    file.uploadedById !== project.uploadedById
  ) {
    throw new ActionError("FORBIDDEN", "Unauthorized");
  }

  return project;
}

function assertMediaFileLimits(
  file: File,
  settings: MediaManagementSettings,
  totalUsedBytes: number,
  userUsedBytes: number,
  hourlyUsedBytes: number,
) {
  const maxFileBytes = settings.maxFileSizeMB * 1024 * 1024;
  const maxTotalBytes = settings.maxTotalStorageGB * 1024 * 1024 * 1024;
  const maxUserBytes = settings.maxStoragePerUserMB * 1024 * 1024;
  const maxHourlyBytes = settings.maxHourlyUploadMB * 1024 * 1024;

  if (file.size <= 0) {
    throw new ActionError("VALIDATION", "EMPTY_FILE");
  }

  if (file.size > maxFileBytes) {
    throw new ActionError(
      "VALIDATION",
      `FILE_TOO_LARGE:${settings.maxFileSizeMB}`,
    );
  }

  if (totalUsedBytes + file.size > maxTotalBytes) {
    throw new ActionError(
      "VALIDATION",
      `TOTAL_QUOTA_EXCEEDED:${settings.maxTotalStorageGB}`,
    );
  }

  if (userUsedBytes + file.size > maxUserBytes) {
    throw new ActionError(
      "VALIDATION",
      `STORAGE_QUOTA_EXCEEDED:${settings.maxStoragePerUserMB}`,
    );
  }

  if (hourlyUsedBytes + file.size > maxHourlyBytes) {
    throw new ActionError(
      "VALIDATION",
      `HOURLY_QUOTA_EXCEEDED:${settings.maxHourlyUploadMB}`,
    );
  }
}

async function getUsageForUpload(
  databaseUrl: string,
  uploadedById: string | null,
) {
  const since = new Date(Date.now() - ONE_HOUR_MS);
  const [totalUsage, userUsage, hourlyUsage] = await Promise.all([
    getProjectMediaUsage(databaseUrl),
    getProjectMediaUsage(databaseUrl, { uploadedById }),
    getProjectMediaUsage(databaseUrl, { uploadedById, since }),
  ]);

  return { totalUsage, userUsage, hourlyUsage };
}

function revalidateMediaPaths(project: ResolvedMediaProject) {
  revalidatePath(`/site/${project.publicId}/dashboard/media`);
  revalidatePath(`/site/${project.publicId}/dashboard/media/upload`);
}

export async function getProjectMediaSettings(context: MediaProjectContext) {
  const project = await resolveMediaProject(context);
  return project.settings;
}

export async function getProjectMediaLibrary(projectId: string) {
  const config = await getProjectConfig(projectId);
  if (!config.databaseUrl) {
    return { files: [], total: 0 };
  }

  const result = await listProjectMediaAssets(config.databaseUrl);
  return {
    files: result.files.map((file) => ({
      id: file.id,
      shortId: file.shortId,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      publicUrl: file.publicUrl,
      alt: file.alt,
      caption: file.caption,
      description: file.description,
      credit: file.credit,
      createdAt: file.createdAt,
    })),
    total: result.total,
  };
}

export async function getProjectMediaFile(projectId: string, fileId: string) {
  const config = await getProjectConfig(projectId);
  if (!config.databaseUrl) return null;

  const file = await getProjectMediaAsset(config.databaseUrl, fileId);
  if (!file) return null;

  return mapMediaAsset(file);
}

export async function deleteProjectMediaFile(
  context: MediaProjectContext,
  fileId: string,
) {
  const project = await resolveMediaProject(context);
  const file = await getProjectMediaAsset(project.databaseUrl, fileId);
  if (!file) throw new ActionError("NOT_FOUND", "File not found");

  if (project.role !== "admin" && file.uploadedById !== project.uploadedById) {
    throw new ActionError("FORBIDDEN", "Unauthorized");
  }

  const removed = await deleteProjectMediaAsset(project.databaseUrl, fileId);
  if (removed?.path) {
    const diskPath = join(process.cwd(), "public", removed.path);
    await unlink(diskPath).catch(() => undefined);
  }

  revalidateMediaPaths(project);
  return { success: true };
}

export async function deleteProjectMediaFileByPublicUrl(
  context: MediaProjectContext,
  publicUrl: string,
) {
  const project = await resolveMediaProject(context);
  const file = await getProjectMediaAssetByPublicUrl(
    project.databaseUrl,
    publicUrl,
  );

  if (!file) return { success: true, deleted: false };

  if (project.role !== "admin" && file.uploadedById !== project.uploadedById) {
    throw new ActionError("FORBIDDEN", "Unauthorized");
  }

  const removed = await deleteProjectMediaAsset(project.databaseUrl, file.id);
  if (removed?.path) {
    const diskPath = join(process.cwd(), "public", removed.path);
    await unlink(diskPath).catch(() => undefined);
  }

  revalidateMediaPaths(project);
  return { success: true, deleted: Boolean(removed) };
}

export async function getProjectMediaUsageStatsForUser(
  projectId: string,
  userId: string | null,
) {
  const config = await getProjectConfig(projectId);
  if (!config.databaseUrl) {
    return {
      usedBytes: 0,
      maxBytes: 10 * 1024 * 1024 * 1024,
    };
  }

  const [stats, features] = await Promise.all([
    getProjectMediaUsage(config.databaseUrl, { uploadedById: userId }),
    getProjectFeatures(projectId),
  ]);
  const maxBytes =
    features.mediaManagement.settings.maxStoragePerUserMB * 1024 * 1024;

  return {
    usedBytes: stats.usedBytes,
    maxBytes,
  };
}

export async function uploadProjectMediaFile(
  context: MediaProjectContext,
  formData: FormData,
) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ActionError("VALIDATION", "FILE_REQUIRED");
  }

  const project = await resolveMediaProject(context);
  const { totalUsage, userUsage, hourlyUsage } = await getUsageForUpload(
    project.databaseUrl,
    project.uploadedById,
  );

  assertMediaFileLimits(
    file,
    project.settings,
    totalUsage.usedBytes,
    userUsage.usedBytes,
    hourlyUsage.usedBytes,
  );

  const originalName = sanitizeFilename(file.name);
  const ext = extname(originalName);
  const storedFilename = `${randomUUID()}${ext}`;
  const { relativePath, diskPath, publicUrl } = getLocalUploadPath(
    project.publicId,
    storedFilename,
  );

  await mkdir(
    join(process.cwd(), "public", "uploads", "projects", project.publicId),
    {
      recursive: true,
    },
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const asset = await createProjectMediaAsset(project.databaseUrl, {
    id: randomUUID(),
    shortId: randomUUID().slice(0, 12),
    filename: originalName,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    path: relativePath,
    publicUrl,
    uploadedById: project.uploadedById,
  });

  revalidateMediaPaths(project);

  return {
    id: asset.id,
    shortId: asset.shortId,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    publicUrl: asset.publicUrl,
    alt: asset.alt,
    caption: asset.caption,
    description: asset.description,
    credit: asset.credit,
    createdAt: asset.createdAt,
  };
}

export async function updateProjectMediaMetadata(
  context: MediaActionContext,
  data: {
    alt: string;
    caption: string;
    description: string;
    credit: string;
  },
) {
  const project = await resolveMediaProjectForAsset(context);
  const updated = await updateProjectMediaAssetMetadata(
    project.databaseUrl,
    context.fileId,
    data,
  );

  revalidateMediaPaths(project);
  return mapMediaAsset(updated);
}

export async function updateProjectMediaImage(
  context: MediaActionContext,
  base64Data: string,
  mimeType: string,
  newSize: number,
) {
  const project = await resolveMediaProjectForAsset(context);
  const file = await getProjectMediaAsset(project.databaseUrl, context.fileId);
  if (!file) throw new ActionError("NOT_FOUND", "File not found");

  const buffer = Buffer.from(
    base64Data.replace(/^data:[^;]+;base64,/, ""),
    "base64",
  );
  const diskPath = join(process.cwd(), "public", file.path);

  await writeFile(diskPath, buffer);

  const updated = await updateProjectMediaAssetFile(
    project.databaseUrl,
    context.fileId,
    {
      size: newSize,
      mimeType,
    },
  );

  revalidateMediaPaths(project);
  return mapMediaAsset(updated);
}
