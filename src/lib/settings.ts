import { cache } from "react";

import { getPrisma, runSerializableTransaction } from "./prisma";
import {
  defaultLoadingSettings,
  sanitizeLoadingSettings,
} from "./site-settings/loading";
import {
  flatToRow,
  rowToFlat,
  sectionsToFlat,
  type AppearanceSettingsFlat,
} from "./site-settings/record";
import {
  defaultThemeSettings,
  sanitizeThemeSettings,
} from "./site-settings/theme";

export type AppearanceSettings = AppearanceSettingsFlat;

const fallback: AppearanceSettings = {
  id: "singleton",
  ...sectionsToFlat({
    theme: defaultThemeSettings,
    loading: defaultLoadingSettings,
  }),
};

function sanitizeAppearanceSettings(
  data: Partial<Omit<AppearanceSettings, "id">>,
): Partial<Omit<AppearanceSettings, "id">> {
  const next: Partial<Omit<AppearanceSettings, "id">> = {};

  const themePatch = sanitizeThemeSettings({
    color: data.themeColor,
    customColor: data.themeCustomColor,
    radius: data.themeRadius,
  });
  if (themePatch.color !== undefined) next.themeColor = themePatch.color;
  if (themePatch.customColor !== undefined) {
    next.themeCustomColor = themePatch.customColor;
  }
  if (themePatch.radius !== undefined) next.themeRadius = themePatch.radius;

  const loadingPatch = sanitizeLoadingSettings({
    enabled: data.loadingEnabled,
    spinner: data.loadingSpinner,
    position: data.loadingPosition,
    colorMode: data.loadingColorMode,
    color: data.loadingColor,
    size: data.loadingSize,
  });
  if (loadingPatch.enabled !== undefined)
    next.loadingEnabled = loadingPatch.enabled;
  if (loadingPatch.spinner !== undefined)
    next.loadingSpinner = loadingPatch.spinner;
  if (loadingPatch.position !== undefined)
    next.loadingPosition = loadingPatch.position;
  if (loadingPatch.colorMode !== undefined)
    next.loadingColorMode = loadingPatch.colorMode;
  if (loadingPatch.color !== undefined) next.loadingColor = loadingPatch.color;
  if (loadingPatch.size !== undefined) next.loadingSize = loadingPatch.size;

  return next;
}

export const getAppearanceSettings = cache(
  async (): Promise<AppearanceSettings> => {
    try {
      const prisma = getPrisma();
      const settings = await prisma.appearanceSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
      });
      return rowToFlat(settings);
    } catch {
      return fallback;
    }
  },
);

export async function updateAppearanceSettings(
  data: Partial<Omit<AppearanceSettings, "id">>,
): Promise<void> {
  const sanitized = sanitizeAppearanceSettings(data);

  if (Object.keys(sanitized).length === 0) {
    return;
  }

  await runSerializableTransaction(async (transaction) => {
    const existing = await transaction.appearanceSettings.findUnique({
      where: { id: "singleton" },
    });

    const current = existing ? rowToFlat(existing) : fallback;
    const next: AppearanceSettings = { ...current, ...sanitized };

    await transaction.appearanceSettings.upsert({
      where: { id: "singleton" },
      update: flatToRow(next),
      create: { id: "singleton", ...flatToRow(next) },
    });
  });
}
