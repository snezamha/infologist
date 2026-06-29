import type { Prisma } from "@prisma/client";

import type { LoadingColorMode, LoadingPosition } from "./shared";
import {
  customThemeColorKey,
  presetThemeColorKeys,
} from "@/lib/theme/custom-color";

import {
  flatToLoadingSettings,
  loadingSettingsToFlat,
  parseLoadingSettings,
  type LoadingSettings,
} from "./loading";
import {
  flatToThemeSettings,
  parseThemeSettings,
  themeSettingsToFlat,
  type ThemeSettings,
} from "./theme";

type PresetThemeColor = (typeof presetThemeColorKeys)[number];
type ThemeColor = PresetThemeColor | typeof customThemeColorKey;

export type AppearanceSettingsRecord = {
  id: string;
  themeSettings: unknown;
  loadingSettings: unknown;
};

export type AppearanceSettingsSections = {
  theme: ThemeSettings;
  loading: LoadingSettings;
};

export type AppearanceSettingsFlat = {
  id: string;
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

function parseAppearanceSettingsSections(
  row: AppearanceSettingsRecord,
): AppearanceSettingsSections {
  return {
    theme: parseThemeSettings(row.themeSettings),
    loading: parseLoadingSettings(row.loadingSettings),
  };
}

export function sectionsToFlat(
  sections: AppearanceSettingsSections,
): Omit<AppearanceSettingsFlat, "id"> {
  return {
    ...themeSettingsToFlat(sections.theme),
    ...loadingSettingsToFlat(sections.loading),
  };
}

function flatToSections(
  flat: AppearanceSettingsFlat,
): AppearanceSettingsSections {
  return {
    theme: flatToThemeSettings(flat),
    loading: flatToLoadingSettings(flat),
  };
}

export function rowToFlat(
  row: AppearanceSettingsRecord,
): AppearanceSettingsFlat {
  return {
    id: row.id,
    ...sectionsToFlat(parseAppearanceSettingsSections(row)),
  };
}

export function flatToRow(flat: AppearanceSettingsFlat) {
  const sections = flatToSections(flat);
  return {
    themeSettings: sections.theme as Prisma.InputJsonValue,
    loadingSettings: sections.loading as Prisma.InputJsonValue,
  };
}
