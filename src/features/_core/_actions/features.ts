"use server";

import { unstable_rethrow } from "next/navigation";

import { getProjectFeatureSettingsSnapshot } from "@/features/_core/lib";
import {
  isProjectFeatureKey,
  parseProjectFeatureState,
  type ProjectFeatures,
} from "@/features/_core/registry";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { ensureProjectFeatureTablesExist } from "@/lib/projects/project/_db/feature-tables";
import { requireProjectManageAccess } from "@/lib/projects/access";
import { revalidateProjectNavigation } from "@/lib/projects/navigation-state.server";

export async function updateProjectFeatures(
  projectId: string,
  features: Partial<ProjectFeatures>,
): Promise<ProjectFeatures> {
  try {
    if (typeof projectId !== "string" || projectId.length === 0) {
      throw new ActionError("VALIDATION", "Invalid project ID");
    }

    await requireProjectManageAccess(projectId);

    const entries = Object.entries(features);
    const parsedEntries = entries.map(([key, feature]) => {
      if (!isProjectFeatureKey(key)) {
        throw new ActionError("VALIDATION", `Unknown feature: ${key}`);
      }

      const state = parseProjectFeatureState(key, feature);
      if (!state) {
        throw new ActionError("VALIDATION", `Invalid settings for ${key}`);
      }

      return [key, state] as const;
    });

    const [config, existingFeatures] = await Promise.all([
      getProjectConfig(projectId),
      getPrisma().projectFeature.findMany({
        where: {
          projectId,
          key: { in: parsedEntries.map(([key]) => key) },
        },
        select: { key: true, enabled: true },
      }),
    ]);
    const existingByKey = new Map(
      existingFeatures.map((feature) => [feature.key, feature]),
    );
    const featuresToInstall = parsedEntries.filter(([key, state]) => {
      const existing = existingByKey.get(key);
      return state.enabled && !existing?.enabled;
    });

    if (featuresToInstall.length > 0 && !config?.databaseUrl) {
      throw new ActionError(
        "UNAVAILABLE",
        "Project database is not configured",
      );
    }
    if (config?.databaseUrl) {
      const databaseUrl = config.databaseUrl;
      try {
        await Promise.all(
          featuresToInstall.map(([key]) =>
            ensureProjectFeatureTablesExist(databaseUrl, key),
          ),
        );
      } catch (cause) {
        throw new ActionError(
          "UNAVAILABLE",
          cause instanceof Error
            ? cause.message
            : "Failed to initialize feature tables",
        );
      }
    }

    const prisma = getPrisma();
    await prisma.$transaction(
      parsedEntries.map(([key, state]) =>
        prisma.projectFeature.upsert({
          where: { projectId_key: { projectId, key } },
          update: state,
          create: { projectId, key, ...state },
        }),
      ),
    );

    revalidateProjectNavigation(projectId);

    return getProjectFeatureSettingsSnapshot(projectId);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) throw error;
    throw new ActionError("UNKNOWN", "Failed to update project features");
  }
}
