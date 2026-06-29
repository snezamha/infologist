import type { Locale } from "@/i18n/config";
import { getProjectConfig } from "@/lib/projects/project/_config";
import {
  getProjectDbSettings,
  setProjectDbSetting,
} from "@/lib/projects/project/_db";
import {
  defaultGeneralSettings,
  flatToGeneralSettings,
  generalSettingsToFlat,
  parseGeneralSettings,
} from "@/lib/site-settings/general";
import {
  defaultLoadingSettings,
  flatToLoadingSettings,
  loadingSettingsToFlat,
  parseLoadingSettings,
} from "@/lib/site-settings/loading";
import {
  defaultSeoSettings,
  flatToSeoSettings,
  parseSeoSettings,
  seoSettingsToFlat,
} from "@/lib/site-settings/seo";
import {
  defaultThemeSettings,
  flatToThemeSettings,
  parseThemeSettings,
  themeSettingsToFlat,
} from "@/lib/site-settings/theme";
import type {
  dateFormatOptions,
  timeFormatOptions,
  timezoneOptions,
  LoadingColorMode,
  LoadingPosition,
} from "@/lib/site-settings/shared";
import {
  customThemeColorKey,
  presetThemeColorKeys,
} from "@/lib/theme/custom-color";

type PresetThemeColor = (typeof presetThemeColorKeys)[number];
type ThemeColor = PresetThemeColor | typeof customThemeColorKey;
type DateFormat = (typeof dateFormatOptions)[number];
type TimeFormat = (typeof timeFormatOptions)[number];
type Timezone = (typeof timezoneOptions)[number];

export type ProjectSettings = {
  id: string;
  siteLanguage: Locale;
  timezone: Timezone;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  seoTitleEn: string;
  seoTitleFa: string;
  seoTitleDe: string;
  seoDescriptionEn: string;
  seoDescriptionFa: string;
  seoDescriptionDe: string;
  seoSeparatorEn: string;
  seoSeparatorFa: string;
  seoSeparatorDe: string;
  themeColor: ThemeColor;
  themeCustomColor: string;
  themeRadius: number;
  loadingEnabled: boolean;
  loadingSpinner: string;
  loadingPosition: LoadingPosition;
  loadingColorMode: LoadingColorMode;
  loadingColor: string;
  loadingSize: number;
};

export type ProjectSettingsSetter = <K extends keyof ProjectSettings>(
  key: K,
  value: ProjectSettings[K],
) => void;

export type ProjectSettingsSectionProps = {
  form: ProjectSettings;
  set: ProjectSettingsSetter;
};

function rawToProjectSettings(
  id: string,
  raw: { general: unknown; seo: unknown; appearance: unknown },
): ProjectSettings {
  const general = parseGeneralSettings(raw.general);
  const seo = parseSeoSettings(raw.seo);
  const appearanceObj = raw.appearance as Record<string, unknown> | null;
  const theme = parseThemeSettings(appearanceObj?.themeSettings);
  const loading = parseLoadingSettings(appearanceObj?.loadingSettings);

  return {
    id,
    ...generalSettingsToFlat(general),
    ...seoSettingsToFlat(seo),
    ...themeSettingsToFlat(theme),
    ...loadingSettingsToFlat(loading),
  };
}

const defaultProjectSettings: Omit<ProjectSettings, "id"> = {
  ...generalSettingsToFlat(defaultGeneralSettings),
  ...seoSettingsToFlat(defaultSeoSettings),
  ...themeSettingsToFlat(defaultThemeSettings),
  ...loadingSettingsToFlat(defaultLoadingSettings),
};

function getDefaultProjectSettings(id: string): ProjectSettings {
  return { id, ...defaultProjectSettings };
}

export async function getProjectSettings(id: string): Promise<ProjectSettings> {
  const config = await getProjectConfig(id);
  if (!config.databaseUrl) return getDefaultProjectSettings(id);

  try {
    const raw = await getProjectDbSettings(config.databaseUrl);
    return rawToProjectSettings(id, raw);
  } catch {
    return getDefaultProjectSettings(id);
  }
}

export async function updateProjectSettings(
  id: string,
  data: Partial<Omit<ProjectSettings, "id">>,
): Promise<void> {
  const config = await getProjectConfig(id);
  if (!config.databaseUrl) throw new Error("Project database not configured");

  const current = await getProjectSettings(id);
  const merged: ProjectSettings = { ...current, ...data };

  const generalRaw = await (async () => {
    try {
      const s = await getProjectDbSettings(config.databaseUrl!);
      return s.general as Record<string, unknown> | null;
    } catch {
      return null;
    }
  })();
  const siteName =
    typeof generalRaw?.siteName === "string" ? generalRaw.siteName : "";

  await Promise.all([
    setProjectDbSetting(config.databaseUrl, "general", {
      ...flatToGeneralSettings({
        siteLanguage: merged.siteLanguage,
        timezone: merged.timezone,
        dateFormat: merged.dateFormat,
        timeFormat: merged.timeFormat,
      }),
      siteName,
    }),
    setProjectDbSetting(
      config.databaseUrl,
      "seo",
      flatToSeoSettings({
        seoTitleEn: merged.seoTitleEn,
        seoTitleFa: merged.seoTitleFa,
        seoTitleDe: merged.seoTitleDe,
        seoDescriptionEn: merged.seoDescriptionEn,
        seoDescriptionFa: merged.seoDescriptionFa,
        seoDescriptionDe: merged.seoDescriptionDe,
        seoSeparatorEn: merged.seoSeparatorEn,
        seoSeparatorFa: merged.seoSeparatorFa,
        seoSeparatorDe: merged.seoSeparatorDe,
      }),
    ),
    setProjectDbSetting(config.databaseUrl, "appearance", {
      themeSettings: flatToThemeSettings({
        themeColor: merged.themeColor as ThemeColor,
        themeCustomColor: merged.themeCustomColor,
        themeRadius: merged.themeRadius,
      }),
      loadingSettings: flatToLoadingSettings({
        loadingEnabled: merged.loadingEnabled,
        loadingSpinner: merged.loadingSpinner,
        loadingPosition: merged.loadingPosition,
        loadingColorMode: merged.loadingColorMode,
        loadingColor: merged.loadingColor,
        loadingSize: merged.loadingSize,
      }),
    }),
  ]);
}
