"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { locales } from "@/i18n/config";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import { requireProjectManageAccess } from "@/lib/projects/access";
import {
  getProjectConfig,
  updateProjectConfig,
  type ProjectConfig,
} from "@/lib/projects/project/_config";
import { verifyClerkAuthConfig } from "@/lib/projects/project/_auth/validate";
import {
  setProjectCustomDomain,
  verifyProjectCustomDomain,
  type DomainVerificationResult,
} from "@/lib/projects/project/custom-domain";

const projectAuthConfigSchema = z.object({
  clerkPublishableKey: z.string().trim().min(1, "Publishable key is required"),
  clerkSecretKey: z.string().trim().min(1, "Secret key is required"),
  databaseUrl: z.string().trim().min(1).optional(),
});

export async function saveProjectAuthConfig(
  id: string,
  data: Partial<ProjectConfig>,
): Promise<ProjectConfig> {
  await requireProjectManageAccess(id);

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id },
    select: { publicId: true },
  });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  const parsed = projectAuthConfigSchema.safeParse(data);
  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid data",
    );
  }

  const nextConfig: Partial<ProjectConfig> = {
    clerkPublishableKey: parsed.data.clerkPublishableKey.trim(),
    clerkSecretKey: parsed.data.clerkSecretKey.trim(),
  };

  if (parsed.data.databaseUrl) {
    nextConfig.databaseUrl = parsed.data.databaseUrl.trim();
  }

  const verification = await verifyClerkAuthConfig({
    clerkPublishableKey: nextConfig.clerkPublishableKey ?? "",
    clerkSecretKey: nextConfig.clerkSecretKey ?? "",
  });

  if (verification.warning) {
    console.warn(
      "[saveProjectAuthConfig] Clerk verification warning:",
      verification.warning,
    );
  }

  await updateProjectConfig(id, nextConfig);

  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/projects/${project.publicId}`);
  }

  return await getProjectConfig(id);
}

export async function saveProjectDomain(
  id: string,
  domain: string,
): Promise<{
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
}> {
  await requireProjectManageAccess(id);

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id },
    select: { publicId: true },
  });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  try {
    await setProjectCustomDomain(id, domain);
    const updated = await prisma.project.findUnique({
      where: { id },
      select: { customDomain: true, customDomainVerifiedAt: true },
    });

    for (const locale of locales) {
      revalidatePath(`/${locale}/dashboard/projects/${project.publicId}`);
    }

    return {
      customDomain: updated?.customDomain ?? null,
      customDomainVerifiedAt: updated?.customDomainVerifiedAt ?? null,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "CONFLICT") {
      throw new ActionError("CONFLICT", "This domain is already in use");
    }
    throw new ActionError("VALIDATION", error.message ?? "Invalid domain");
  }
}

export async function removeProjectDomain(id: string): Promise<{
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
}> {
  await requireProjectManageAccess(id);

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id },
    select: { publicId: true },
  });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  await setProjectCustomDomain(id, null);
  const updated = await prisma.project.findUnique({
    where: { id },
    select: { customDomain: true, customDomainVerifiedAt: true },
  });

  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/projects/${project.publicId}`);
  }

  return {
    customDomain: updated?.customDomain ?? null,
    customDomainVerifiedAt: updated?.customDomainVerifiedAt ?? null,
  };
}

export async function verifyProjectDomain(id: string): Promise<{
  project: { customDomain: string | null; customDomainVerifiedAt: Date | null };
  result: DomainVerificationResult;
}> {
  await requireProjectManageAccess(id);

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      publicId: true,
      customDomain: true,
      customDomainVerifiedAt: true,
    },
  });
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");
  if (!project.customDomain)
    throw new ActionError("NOT_FOUND", "No custom domain configured");

  const result = await verifyProjectCustomDomain(id);

  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/projects/${project.publicId}`);
  }

  const updated = await prisma.project.findUnique({
    where: { id },
    select: { customDomain: true, customDomainVerifiedAt: true },
  });

  return {
    project: {
      customDomain: updated?.customDomain ?? null,
      customDomainVerifiedAt: updated?.customDomainVerifiedAt ?? null,
    },
    result,
  };
}
