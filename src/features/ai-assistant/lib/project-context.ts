import { getPrisma } from "@/lib/prisma";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { ActionError } from "@/lib/errors/action-error";
import { moduleActionErrorMessages } from "@/features/_core/module-error-messages";

async function requireAiAssistantProject(projectPublicId: string) {
  const project = await getPrisma().project.findUnique({
    where: { publicId: projectPublicId },
    select: {
      id: true,
      features: {
        where: { key: "aiAssistant" },
        select: { enabled: true },
        take: 1,
      },
    },
  });
  if (!project || !project.features[0]?.enabled) {
    throw new Error("AI assistant is not available");
  }

  const config = await getProjectConfig(project.id);
  if (!config.databaseUrl) {
    throw new Error(moduleActionErrorMessages.projectDatabaseNotConfigured);
  }
  return { projectId: project.id, databaseUrl: config.databaseUrl };
}

export async function requireAiAssistantProjectSession(
  projectPublicId: string,
) {
  const project = await requireAiAssistantProject(projectPublicId);
  const session = await getProjectSession(project.projectId, projectPublicId);

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "Unauthorized");
  }

  return { ...project, session };
}

export async function requireAiAssistantProjectAdmin(projectPublicId: string) {
  const project = await requireAiAssistantProjectSession(projectPublicId);

  if (project.session.role !== "admin") {
    throw new ActionError("FORBIDDEN", "Admin access required");
  }

  return project;
}
