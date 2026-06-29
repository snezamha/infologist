import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import { getProjectFeatures } from "@/lib/projects/features";
import { listProjectModulesForProject } from "@/lib/projects/modules";
import type { ProjectNavigationState } from "./navigation-state";

const NAVIGATION_REVALIDATE_SECONDS = 60;

export function projectNavigationTag(projectId: string): string {
  return `project-nav:${projectId}`;
}

export async function getProjectNavigationState(
  projectId: string,
): Promise<ProjectNavigationState> {
  const [features, modules] = await Promise.all([
    getProjectFeatures(projectId),
    listProjectModulesForProject(projectId),
  ]);

  return {
    features: {
      mediaManagement: features.mediaManagement.enabled,
      statistics: features.statistics.enabled,
      aiAssistant: features.aiAssistant.enabled,
      pageBuilder: features.pageBuilder.enabled,
    },
    modules: modules
      .filter((module) => module.active)
      .map((module) => ({ key: module.key, title: module.title })),
  };
}

export function getCachedProjectNavigationState(
  projectId: string,
): Promise<ProjectNavigationState> {
  return unstable_cache(
    () => getProjectNavigationState(projectId),
    ["project-navigation", projectId],
    {
      tags: [projectNavigationTag(projectId)],
      revalidate: NAVIGATION_REVALIDATE_SECONDS,
    },
  )();
}

export function revalidateProjectNavigation(projectId: string): void {
  revalidateTag(projectNavigationTag(projectId), "max");
}
