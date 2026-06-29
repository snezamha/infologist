import { getProjectFeatures } from "@/lib/projects/features";

export { getProjectFeatures };

export async function getProjectFeatureSettingsSnapshot(projectId: string) {
  return getProjectFeatures(projectId);
}
