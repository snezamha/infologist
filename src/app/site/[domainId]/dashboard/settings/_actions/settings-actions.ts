"use server";

import { unstable_rethrow } from "next/navigation";

import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import {
  updateProjectSettings,
  type ProjectSettings,
} from "@/lib/projects/project/settings";
import { ActionError } from "@/lib/errors/action-error";

export async function saveSiteSettings(
  domainId: string,
  data: Partial<Omit<ProjectSettings, "id">>,
): Promise<void> {
  try {
    const project = await getPublicProject(domainId);
    if (!project) throw new ActionError("NOT_FOUND", "Project not found");

    const user = await getProjectSession(project.id, domainId);
    if (!user || user.role !== "admin") {
      throw new ActionError("UNAUTHORIZED", "Admin access required");
    }

    await updateProjectSettings(project.id, data);
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}
