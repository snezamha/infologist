import { cache } from "react";

import { getPrisma } from "@/lib/prisma";
import { getProjectPublicIdCandidates } from "@/lib/projects/project/domain";
import { getProjectConfig } from "@/lib/projects/project/_config";
import {
  getProjectDbSettings,
  type ProjectDbSettings,
} from "@/lib/projects/project/_db";

export const getPublicProject = cache(async (domainId: string) => {
  const prisma = getPrisma();

  return prisma.project.findFirst({
    where: {
      status: "active",
      OR: [
        { publicId: { in: getProjectPublicIdCandidates(domainId) } },
        { customDomain: domainId },
      ],
    },
  });
});

const emptySettings: ProjectDbSettings = {
  general: {},
  seo: {},
  appearance: {},
};

export const getPublicProjectSettings = cache(
  async function getPublicProjectSettings(
    projectId: string,
  ): Promise<ProjectDbSettings> {
    const config = await getProjectConfig(projectId);
    if (!config.databaseUrl) return emptySettings;
    try {
      return await getProjectDbSettings(config.databaseUrl);
    } catch {
      return emptySettings;
    }
  },
);
