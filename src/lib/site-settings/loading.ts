import {
  defaultLoadingColor,
  defaultLoadingColorMode,
  defaultLoadingPosition,
  defaultLoadingSize,
  defaultLoadingSpinner,
  sanitizeLoadingColor,
  sanitizeLoadingColorMode,
  sanitizeLoadingPosition,
  sanitizeLoadingSize,
  sanitizeLoadingSpinner,
  type LoadingColorMode,
  type LoadingPosition,
} from "./shared";

export type LoadingSettings = {
  enabled: boolean;
  spinner: string;
  position: LoadingPosition;
  colorMode: LoadingColorMode;
  color: string;
  size: number;
};

export const defaultLoadingSettings: LoadingSettings = {
  enabled: true,
  spinner: defaultLoadingSpinner,
  position: defaultLoadingPosition,
  colorMode: defaultLoadingColorMode,
  color: defaultLoadingColor,
  size: defaultLoadingSize,
};

export function parseLoadingSettings(value: unknown): LoadingSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    enabled:
      typeof record.enabled === "boolean"
        ? record.enabled
        : defaultLoadingSettings.enabled,
    spinner:
      sanitizeLoadingSpinner(record.spinner) ?? defaultLoadingSettings.spinner,
    position:
      sanitizeLoadingPosition(record.position) ??
      defaultLoadingSettings.position,
    colorMode:
      sanitizeLoadingColorMode(record.colorMode) ??
      defaultLoadingSettings.colorMode,
    color: sanitizeLoadingColor(record.color) ?? defaultLoadingSettings.color,
    size: sanitizeLoadingSize(record.size) ?? defaultLoadingSettings.size,
  };
}

export function sanitizeLoadingSettings(
  data: Partial<LoadingSettings>,
): Partial<LoadingSettings> {
  const next: Partial<LoadingSettings> = {};

  if (typeof data.enabled === "boolean") {
    next.enabled = data.enabled;
  }

  const spinner = sanitizeLoadingSpinner(data.spinner);
  if (spinner) {
    next.spinner = spinner;
  }

  const position = sanitizeLoadingPosition(data.position);
  if (position) {
    next.position = position;
  }

  const colorMode = sanitizeLoadingColorMode(data.colorMode);
  if (colorMode) {
    next.colorMode = colorMode;
  }

  const color = sanitizeLoadingColor(data.color);
  if (color) {
    next.color = color;
  }

  const size = sanitizeLoadingSize(data.size);
  if (size !== undefined) {
    next.size = size;
  }

  return next;
}

export function loadingSettingsToFlat(settings: LoadingSettings) {
  return {
    loadingEnabled: settings.enabled,
    loadingSpinner: settings.spinner,
    loadingPosition: settings.position,
    loadingColorMode: settings.colorMode,
    loadingColor: settings.color,
    loadingSize: settings.size,
  };
}

export function flatToLoadingSettings(flat: {
  loadingEnabled: boolean;
  loadingSpinner: string;
  loadingPosition: LoadingPosition;
  loadingColorMode: LoadingColorMode;
  loadingColor: string;
  loadingSize: number;
}): LoadingSettings {
  return parseLoadingSettings({
    enabled: flat.loadingEnabled,
    spinner: flat.loadingSpinner,
    position: flat.loadingPosition,
    colorMode: flat.loadingColorMode,
    color: flat.loadingColor,
    size: flat.loadingSize,
  });
}
