import "server-only";

import { getPrisma } from "@/lib/prisma";
import { getProjectDomainId } from "@/lib/projects/project/domain";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";

export async function getModuleSession(projectPublicId: string) {
  const domainId = getProjectDomainId(projectPublicId);

  const project = await getPrisma().project.findFirst({
    where: { publicId: projectPublicId },
    select: { id: true },
  });

  if (!project) return null;

  return getProjectSession(project.id, domainId);
}
