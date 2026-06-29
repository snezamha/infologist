"use server";

import { unstable_rethrow } from "next/navigation";

import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { ActionError } from "@/lib/errors/action-error";
import {
  setProjectCustomDomain,
  verifyProjectCustomDomain,
  type DomainVerificationResult,
} from "@/lib/projects/project/custom-domain";

async function requireProjectAdmin(domainId: string) {
  const project = await getPublicProject(domainId);
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  const user = await getProjectSession(project.id, domainId);
  if (!user || user.role !== "admin") {
    throw new ActionError("UNAUTHORIZED", "Admin access required");
  }

  return project;
}

export async function saveSiteCustomDomain(
  domainId: string,
  domain: string | null,
): Promise<void> {
  try {
    const project = await requireProjectAdmin(domainId);
    await setProjectCustomDomain(project.id, domain);
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}

export async function verifySiteCustomDomain(
  domainId: string,
): Promise<DomainVerificationResult> {
  try {
    const project = await requireProjectAdmin(domainId);
    return verifyProjectCustomDomain(project.id);
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}
