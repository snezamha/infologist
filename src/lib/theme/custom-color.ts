export const defaultThemeCustomColor = "#2563eb";

export const customThemeColorKey = "custom" as const;

export const presetThemeColorKeys = [
  "neutral",
  "blue",
  "green",
  "rose",
  "orange",
  "violet",
  "teal",
] as const;

export function normalizeThemeHex(value: string): string | undefined {
  const trimmed = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^[0-9a-f]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }

  return undefined;
}

export function hexToCss(value: string): string {
  return normalizeThemeHex(value) ?? defaultThemeCustomColor;
}

function parseHex(value: string) {
  const hex = normalizeThemeHex(value);

  if (!hex) {
    return null;
  }

  const channels = hex.slice(1);

  return {
    r: Number.parseInt(channels.slice(0, 2), 16),
    g: Number.parseInt(channels.slice(2, 4), 16),
    b: Number.parseInt(channels.slice(4, 6), 16),
  };
}

export function getContrastForeground(hex: string): string {
  const rgb = parseHex(hex);

  if (!rgb) {
    return "oklch(0.985 0 0)";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.58 ? "oklch(0.205 0 0)" : "oklch(0.985 0 0)";
}

export function mixHexWithWhite(hex: string, whiteRatio: number): string {
  const rgb = parseHex(hex);

  if (!rgb) {
    return defaultThemeCustomColor;
  }

  const ratio = Math.min(1, Math.max(0, whiteRatio));
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * ratio);

  return `#${[mix(rgb.r), mix(rgb.g), mix(rgb.b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function sanitizeThemeCustomColor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return normalizeThemeHex(value);
}
