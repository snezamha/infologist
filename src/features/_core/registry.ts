import { z } from "zod";

const mediaManagementSettingsSchema = z
  .object({
    maxFileSizeMB: z.number().int().min(1).max(100),
    maxHourlyUploadMB: z.number().int().min(1).max(1000),
    maxTotalStorageGB: z.number().int().min(1).max(100),
    maxStoragePerUserMB: z.number().int().min(1).max(10240),
  })
  .strict();

const statisticsSettingsSchema = z
  .object({
    sessionTimeoutSeconds: z.number().int().min(60).max(7200),
    liveThresholdSeconds: z.number().int().min(60).max(1800),
  })
  .strict();

const aiAssistantSettingsSchema = z.object({}).strict();

const pageBuilderSettingsSchema = z.object({}).strict();

export type MediaManagementSettings = z.infer<
  typeof mediaManagementSettingsSchema
>;
export type StatisticsSettings = z.infer<typeof statisticsSettingsSchema>;
export type AiAssistantSettings = z.infer<typeof aiAssistantSettingsSchema>;
type PageBuilderSettings = z.infer<typeof pageBuilderSettingsSchema>;

type FeatureSettingsMap = {
  mediaManagement: MediaManagementSettings;
  statistics: StatisticsSettings;
  aiAssistant: AiAssistantSettings;
  pageBuilder: PageBuilderSettings;
};

export type ProjectFeatureKey = keyof FeatureSettingsMap;

export type ProjectFeatureSettings<
  K extends ProjectFeatureKey = ProjectFeatureKey,
> = FeatureSettingsMap[K];

export type ProjectFeatureState<
  K extends ProjectFeatureKey = ProjectFeatureKey,
> = {
  enabled: boolean;
  settings: ProjectFeatureSettings<K>;
};

export type ProjectFeatures = {
  [K in ProjectFeatureKey]: ProjectFeatureState<K>;
};

type ProjectFeatureSettingField = {
  key: string;
  min: number;
  max: number;
  storageScale: number;
};

export type ProjectFeatureDefinition<
  K extends ProjectFeatureKey = ProjectFeatureKey,
> = {
  key: K;
  settingsSchema: z.ZodType<ProjectFeatureSettings<K>>;
  defaultSettings: ProjectFeatureSettings<K>;
  settingsFields: readonly ProjectFeatureSettingField[];
  dbTables: readonly string[];
  legacyDbTables: readonly string[];
};

export const projectFeatureRegistry = [
  {
    key: "mediaManagement",
    settingsSchema: mediaManagementSettingsSchema,
    defaultSettings: {
      maxFileSizeMB: 2,
      maxHourlyUploadMB: 10,
      maxTotalStorageGB: 1,
      maxStoragePerUserMB: 128,
    },
    settingsFields: [
      { key: "maxFileSizeMB", min: 1, max: 100, storageScale: 1 },
      { key: "maxHourlyUploadMB", min: 1, max: 1000, storageScale: 1 },
      { key: "maxTotalStorageGB", min: 1, max: 100, storageScale: 1 },
      { key: "maxStoragePerUserMB", min: 1, max: 10240, storageScale: 1 },
    ],
    dbTables: ["media_assets"],
    legacyDbTables: ["media_files"],
  },
  {
    key: "statistics",
    settingsSchema: statisticsSettingsSchema,
    defaultSettings: {
      sessionTimeoutSeconds: 30 * 60,
      liveThresholdSeconds: 3 * 60,
    },
    settingsFields: [
      { key: "sessionTimeoutSeconds", min: 1, max: 120, storageScale: 60 },
      { key: "liveThresholdSeconds", min: 1, max: 30, storageScale: 60 },
    ],
    dbTables: ["visitors"],
    legacyDbTables: [
      "visitor_events",
      "events",
      "page_views",
      "session_events",
    ],
  },
  {
    key: "aiAssistant",
    settingsSchema: aiAssistantSettingsSchema,
    defaultSettings: {},
    settingsFields: [],
    dbTables: ["ai_assistant_settings", "prompt_templates"],
    legacyDbTables: [],
  },
  {
    key: "pageBuilder",
    settingsSchema: pageBuilderSettingsSchema,
    defaultSettings: {},
    settingsFields: [],
    dbTables: ["page_content", "pages"],
    legacyDbTables: [],
  },
] as const;

const projectFeatureDefinitionMap = new Map<
  ProjectFeatureKey,
  ProjectFeatureDefinition
>(
  projectFeatureRegistry.map((definition) => [
    definition.key,
    definition as ProjectFeatureDefinition,
  ]),
);

export function isProjectFeatureKey(
  value: unknown,
): value is ProjectFeatureKey {
  return (
    typeof value === "string" &&
    projectFeatureDefinitionMap.has(value as ProjectFeatureKey)
  );
}

function getProjectFeatureDefinition(
  key: ProjectFeatureKey,
): ProjectFeatureDefinition {
  return projectFeatureDefinitionMap.get(key)!;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseProjectFeatureSettings(
  key: ProjectFeatureKey,
  value: unknown,
): ProjectFeatureSettings {
  const definition = getProjectFeatureDefinition(key);
  const candidate = isRecord(value)
    ? { ...definition.defaultSettings, ...value }
    : definition.defaultSettings;
  const parsed = definition.settingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : definition.defaultSettings;
}

export function parseProjectFeatureState(
  key: ProjectFeatureKey,
  value: unknown,
): ProjectFeatureState | null {
  if (!isRecord(value) || typeof value.enabled !== "boolean") return null;

  const definition = getProjectFeatureDefinition(key);
  const candidate = isRecord(value.settings)
    ? { ...definition.defaultSettings, ...value.settings }
    : value.settings;
  const settings = definition.settingsSchema.safeParse(candidate);
  if (!settings.success) return null;

  return { enabled: value.enabled, settings: settings.data };
}
