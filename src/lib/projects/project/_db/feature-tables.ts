import { type ProjectFeatureKey } from "@/features/_core/registry";
import {
  ensureProjectAiAssistantTables,
  ensureProjectMediaTable,
  ensureProjectPageBuilderTables,
  ensureProjectVisitorsTable,
} from "./feature-schemas";

export async function ensureProjectFeatureTablesExist(
  databaseUrl: string,
  featureKey: ProjectFeatureKey,
): Promise<void> {
  const installers: Record<ProjectFeatureKey, (url: string) => Promise<void>> =
    {
      mediaManagement: ensureProjectMediaTable,
      statistics: ensureProjectVisitorsTable,
      aiAssistant: ensureProjectAiAssistantTables,
      pageBuilder: ensureProjectPageBuilderTables,
    };
  await installers[featureKey](databaseUrl);
}
