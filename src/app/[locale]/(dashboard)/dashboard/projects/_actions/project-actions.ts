"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { Prisma, type ProjectStatus } from "@prisma/client";
import { z } from "zod";

import { locales } from "@/i18n/config";
import { requirePermission } from "@/lib/auth/rbac";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import { generatePublicId } from "@/lib/public-id";
import { requireProjectManageAccess } from "@/lib/projects/access";
import {
  getProjectConfig,
  updateProjectConfig,
} from "@/lib/projects/project/_config";
import {
  provisionProjectDatabase,
  deleteProjectDatabase,
} from "@/lib/projects/project/_db";
import {
  PROJECT_NAME_MAX_LENGTH,
  type ProjectNameForm,
  type ProjectWizardForm,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

const PROJECT_PUBLIC_ID_PREFIX = "prj";
const PUBLIC_ID_CREATE_ATTEMPTS = 5;

const projectNameSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
});

const projectWithConfigSchema = projectNameSchema.extend({
  databaseUrl: z.string().min(1, "Database URL is required"),
  clerkPublishableKey: z.string().trim().optional().or(z.literal("")),
  clerkSecretKey: z.string().trim().optional().or(z.literal("")),
});

export type ProjectFormData = ProjectNameForm;
export type ProjectWithConfigData = ProjectWizardForm;

export type ProjectRecord = {
  id: string;
  ownerId: string | null;
  publicId: string;
  name: string;
  status: ProjectStatus;
  statusMessage: string | null;
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
  provisionedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const projectSelect = {
  id: true,
  ownerId: true,
  publicId: true,
  name: true,
  status: true,
  statusMessage: true,
  customDomain: true,
  customDomainVerifiedAt: true,
  provisionedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

function getProjectAccessWhere(userId: string, role: string) {
  return role === "super_admin" ? {} : { ownerId: userId };
}

function revalidateProjectPaths(publicId?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/projects`);
    if (publicId) {
      revalidatePath(`/${locale}/dashboard/projects/${publicId}`);
    }
  }
}

function isPublicIdUniqueConstraintError(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.some((v) =>
      ["publicId", "public_id", "projects_public_id_key"].includes(String(v)),
    );
  }
  return (
    typeof target === "string" &&
    ["publicId", "public_id", "projects_public_id_key"].some((v) =>
      target.includes(v),
    )
  );
}

export async function getProjects(): Promise<ProjectRecord[]> {
  const session = await requirePermission("projects.read");
  const prisma = getPrisma();
  return prisma.project.findMany({
    where: getProjectAccessWhere(session.user.id, session.user.role),
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  });
}

export async function getProjectByPublicId(
  publicId: string,
): Promise<ProjectRecord> {
  const session = await requirePermission("projects.read");
  const prisma = getPrisma();
  const project = await prisma.project.findFirst({
    where: {
      publicId,
      ...getProjectAccessWhere(session.user.id, session.user.role),
    },
    select: projectSelect,
  });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");
  return project;
}

export async function createProjectWithConfig(
  data: ProjectWithConfigData,
): Promise<ProjectRecord> {
  const session = await requirePermission("projects.manage");

  const parsed = projectWithConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid data",
    );
  }

  const prisma = getPrisma();
  let projectId: string | undefined;

  for (let attempt = 0; attempt < PUBLIC_ID_CREATE_ATTEMPTS; attempt += 1) {
    try {
      const project = await prisma.project.create({
        data: {
          ownerId: session.user.id,
          publicId: generatePublicId(PROJECT_PUBLIC_ID_PREFIX),
          name: parsed.data.name,
          status: "active",
        },
        select: projectSelect,
      });

      projectId = project.id;

      await updateProjectConfig(project.id, {
        databaseUrl: parsed.data.databaseUrl,
        clerkPublishableKey: parsed.data.clerkPublishableKey || null,
        clerkSecretKey: parsed.data.clerkSecretKey || null,
      });

      await provisionProjectDatabase(parsed.data.databaseUrl);

      const updated = await prisma.project.update({
        where: { id: project.id },
        data: { provisionedAt: new Date() },
        select: projectSelect,
      });

      revalidateProjectPaths();
      return updated;
    } catch (error) {
      unstable_rethrow(error);

      if (error instanceof ActionError) {
        throw error;
      }

      if (isPublicIdUniqueConstraintError(error)) continue;

      console.error("[createProjectWithConfig] provisioning error:", error);

      if (projectId) {
        const message =
          error instanceof Error ? error.message : "Provisioning failed";
        await prisma.project
          .update({
            where: { id: projectId },
            data: { status: "suspended", statusMessage: message },
          })
          .catch(console.error);
      }

      throw new ActionError("UNAVAILABLE", "Project provisioning failed");
    }
  }

  throw new ActionError("UNKNOWN", "Failed to generate unique public ID");
}

export async function updateProject(
  id: string,
  data: ProjectFormData,
): Promise<ProjectRecord> {
  await requireProjectManageAccess(id);

  const parsed = projectNameSchema.safeParse(data);
  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid data",
    );
  }

  const prisma = getPrisma();
  const current = await prisma.project.findUnique({ where: { id } });
  if (!current) throw new ActionError("NOT_FOUND", "Project not found");

  const project = await prisma.project.update({
    where: { id },
    data: { name: parsed.data.name },
    select: projectSelect,
  });

  revalidateProjectPaths(current.publicId);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  await requireProjectManageAccess(id);
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  const config = await getProjectConfig(id);

  await prisma.project.delete({ where: { id } });

  if (config.databaseUrl) {
    await deleteProjectDatabase(config.databaseUrl);
  }

  revalidateProjectPaths(project.publicId);
}

export async function retryProjectProvisioning(
  id: string,
): Promise<ProjectRecord> {
  await requireProjectManageAccess(id);

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");
  if (project.status !== "suspended") {
    throw new ActionError("CONFLICT", "Only suspended projects can be retried");
  }

  const config = await getProjectConfig(id);
  if (!config.databaseUrl) {
    throw new ActionError("CONFLICT", "Project has no database URL configured");
  }

  try {
    await provisionProjectDatabase(config.databaseUrl);

    const updated = await prisma.project.update({
      where: { id },
      data: {
        status: "active",
        statusMessage: null,
        provisionedAt: new Date(),
      },
      select: projectSelect,
    });

    revalidateProjectPaths(project.publicId);
    return updated;
  } catch (error) {
    unstable_rethrow(error);

    const message =
      error instanceof Error ? error.message : "Provisioning failed";
    await prisma.project
      .update({
        where: { id },
        data: { statusMessage: message },
      })
      .catch(() => null);

    throw new ActionError("UNAVAILABLE", "Project provisioning retry failed");
  }
}
