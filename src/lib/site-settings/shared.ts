import {
  defaultLoadingSpinner,
  isLoadingSpinnerId,
} from "@/lib/loading-spinners";

export const dateFormatOptions = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "D MMMM YYYY",
  "MMMM D, YYYY",
] as const;

export const timeFormatOptions = ["HH:mm", "hh:mm A"] as const;

export const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Tehran",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export const loadingPositionOptions = [
  "top-start",
  "top-center",
  "top-end",
  "center",
  "bottom-start",
  "bottom-center",
  "bottom-end",
] as const;

export const loadingColorModeOptions = ["theme", "custom"] as const;

export type LoadingPosition = (typeof loadingPositionOptions)[number];
export type LoadingColorMode = (typeof loadingColorModeOptions)[number];

export const defaultLoadingColor = "#2563eb";
export const defaultLoadingSize = 64;
export const defaultLoadingPosition: LoadingPosition = "top-end";
export const defaultLoadingColorMode: LoadingColorMode = "theme";

export function sanitizeLoadingSpinner(value: unknown) {
  return isLoadingSpinnerId(value) ? value : undefined;
}

export function sanitizeLoadingPosition(
  value: unknown,
): LoadingPosition | undefined {
  return loadingPositionOptions.includes(value as LoadingPosition)
    ? (value as LoadingPosition)
    : undefined;
}

export function sanitizeLoadingColorMode(
  value: unknown,
): LoadingColorMode | undefined {
  return loadingColorModeOptions.includes(value as LoadingColorMode)
    ? (value as LoadingColorMode)
    : undefined;
}

export function sanitizeLoadingColor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const color = value.trim();

  return /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

export function sanitizeLoadingSize(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const size = Math.round(value);

  if (size < 32 || size > 128) {
    return undefined;
  }

  return size;
}

export function resolveLoadingColor(
  mode: LoadingColorMode,
  customColor: string,
) {
  return mode === "theme" ? "var(--primary)" : customColor;
}

export { defaultLoadingSpinner };
