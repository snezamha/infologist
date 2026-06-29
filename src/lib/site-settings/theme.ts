import { radiusPresets } from "@/lib/theme/presets";
import {
  customThemeColorKey,
  defaultThemeCustomColor,
  presetThemeColorKeys,
  sanitizeThemeCustomColor,
} from "@/lib/theme/custom-color";

type PresetThemeColor = (typeof presetThemeColorKeys)[number];
type ThemeColor = PresetThemeColor | typeof customThemeColorKey;

export type ThemeSettings = {
  color: ThemeColor;
  customColor: string;
  radius: number;
};

export const defaultThemeSettings: ThemeSettings = {
  color: "neutral",
  customColor: defaultThemeCustomColor,
  radius: 0.625,
};

function sanitizeThemeRadius(value: unknown): number | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  return radiusPresets.some((preset) => preset.value === value)
    ? value
    : undefined;
}

export function parseThemeSettings(value: unknown): ThemeSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const color =
    record.color === customThemeColorKey
      ? customThemeColorKey
      : (presetThemeColorKeys as readonly string[]).includes(
            String(record.color),
          )
        ? (record.color as PresetThemeColor)
        : defaultThemeSettings.color;

  return {
    color,
    customColor:
      sanitizeThemeCustomColor(record.customColor) ??
      defaultThemeSettings.customColor,
    radius: sanitizeThemeRadius(record.radius) ?? defaultThemeSettings.radius,
  };
}

export function sanitizeThemeSettings(
  data: Partial<ThemeSettings>,
): Partial<ThemeSettings> {
  const next: Partial<ThemeSettings> = {};

  if (
    typeof data.color === "string" &&
    (data.color === customThemeColorKey ||
      (presetThemeColorKeys as readonly string[]).includes(data.color))
  ) {
    next.color = data.color as ThemeColor;
  }

  const customColor = sanitizeThemeCustomColor(data.customColor);
  if (customColor) {
    next.customColor = customColor;
  }

  const radius = sanitizeThemeRadius(data.radius);
  if (radius !== undefined) {
    next.radius = radius;
  }

  return next;
}

export function themeSettingsToFlat(settings: ThemeSettings) {
  return {
    themeColor: settings.color,
    themeCustomColor: settings.customColor,
    themeRadius: settings.radius,
  };
}

export function flatToThemeSettings(flat: {
  themeColor: ThemeColor;
  themeCustomColor: string;
  themeRadius: number;
}): ThemeSettings {
  return parseThemeSettings({
    color: flat.themeColor,
    customColor: flat.themeCustomColor,
    radius: flat.themeRadius,
  });
}
