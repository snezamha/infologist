import { cache } from "react";

import {
  parseProjectFeatureSettings,
  projectFeatureRegistry,
  type ProjectFeatures,
} from "@/features/_core/registry";
import { getPrisma } from "@/lib/prisma";

export const getProjectFeatures = cache(async function getProjectFeatures(
  projectId: string,
): Promise<ProjectFeatures> {
  const prisma = getPrisma();
  const features = await prisma.projectFeature.findMany({
    where: { projectId },
  });

  return Object.fromEntries(
    projectFeatureRegistry.map((feature) => {
      const stored = features.find((f) => f.key === feature.key);
      return [
        feature.key,
        {
          enabled: stored?.enabled ?? false,
          settings: parseProjectFeatureSettings(feature.key, stored?.settings),
        },
      ];
    }),
  ) as ProjectFeatures;
});
