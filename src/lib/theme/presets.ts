import {
  customThemeColorKey,
  defaultThemeCustomColor,
  getContrastForeground,
  hexToCss,
  mixHexWithWhite,
} from "./custom-color";

export type ColorPreset = {
  label: string;
  swatch: string;
  light: { primary: string; primaryForeground: string; ring: string };
  dark: { primary: string; primaryForeground: string; ring: string };
};

export const colorPresets: Record<string, ColorPreset> = {
  neutral: {
    label: "Neutral",
    swatch: "#1a1a1a",
    light: {
      primary: "oklch(0.205 0 0)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      primary: "oklch(0.922 0 0)",
      primaryForeground: "oklch(0.205 0 0)",
      ring: "oklch(0.439 0 0)",
    },
  },
  blue: {
    label: "Blue",
    swatch: "#3b82f6",
    light: {
      primary: "oklch(0.546 0.245 262.881)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.546 0.245 262.881)",
    },
    dark: {
      primary: "oklch(0.707 0.165 254.624)",
      primaryForeground: "oklch(0.153 0.01 260)",
      ring: "oklch(0.707 0.165 254.624)",
    },
  },
  green: {
    label: "Green",
    swatch: "#22c55e",
    light: {
      primary: "oklch(0.527 0.154 150.069)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.527 0.154 150.069)",
    },
    dark: {
      primary: "oklch(0.696 0.17 152.535)",
      primaryForeground: "oklch(0.15 0.01 145)",
      ring: "oklch(0.696 0.17 152.535)",
    },
  },
  rose: {
    label: "Rose",
    swatch: "#f43f5e",
    light: {
      primary: "oklch(0.541 0.229 6.586)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.541 0.229 6.586)",
    },
    dark: {
      primary: "oklch(0.712 0.194 12.989)",
      primaryForeground: "oklch(0.15 0.01 5)",
      ring: "oklch(0.712 0.194 12.989)",
    },
  },
  orange: {
    label: "Orange",
    swatch: "#f97316",
    light: {
      primary: "oklch(0.646 0.222 41.116)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.646 0.222 41.116)",
    },
    dark: {
      primary: "oklch(0.75 0.183 55.934)",
      primaryForeground: "oklch(0.15 0.01 45)",
      ring: "oklch(0.75 0.183 55.934)",
    },
  },
  violet: {
    label: "Violet",
    swatch: "#8b5cf6",
    light: {
      primary: "oklch(0.513 0.262 281.703)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.513 0.262 281.703)",
    },
    dark: {
      primary: "oklch(0.702 0.183 285.119)",
      primaryForeground: "oklch(0.15 0.01 285)",
      ring: "oklch(0.702 0.183 285.119)",
    },
  },
  teal: {
    label: "Teal",
    swatch: "#14b8a6",
    light: {
      primary: "oklch(0.511 0.127 198.131)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.511 0.127 198.131)",
    },
    dark: {
      primary: "oklch(0.704 0.14 182.503)",
      primaryForeground: "oklch(0.15 0.01 198)",
      ring: "oklch(0.704 0.14 182.503)",
    },
  },
};

export type RadiusPreset = {
  label: string;
  value: number;
};

export const radiusPresets: RadiusPreset[] = [
  { label: "none", value: 0 },
  { label: "sm", value: 0.3 },
  { label: "md", value: 0.625 },
  { label: "lg", value: 0.875 },
  { label: "xl", value: 1.25 },
];

function buildCustomColorPreset(hex: string): ColorPreset {
  const color = hexToCss(hex);
  const darkPrimary = mixHexWithWhite(color, 0.35);

  return {
    label: "Custom",
    swatch: color,
    light: {
      primary: color,
      primaryForeground: getContrastForeground(color),
      ring: color,
    },
    dark: {
      primary: darkPrimary,
      primaryForeground: getContrastForeground(darkPrimary),
      ring: darkPrimary,
    },
  };
}

export function resolveThemePalette(
  themeColor: string,
  themeCustomColor = defaultThemeCustomColor,
): ColorPreset {
  if (themeColor === customThemeColorKey) {
    return buildCustomColorPreset(themeCustomColor);
  }

  return colorPresets[themeColor] ?? colorPresets.neutral;
}

export function generateThemeCss(
  themeColor: string,
  themeRadius: number,
  themeCustomColor = defaultThemeCustomColor,
): string {
  const { light, dark } = resolveThemePalette(themeColor, themeCustomColor);

  return `
:root {
  --primary: ${light.primary};
  --primary-foreground: ${light.primaryForeground};
  --ring: ${light.ring};
  --sidebar-primary: ${light.primary};
  --sidebar-primary-foreground: ${light.primaryForeground};
  --radius: ${themeRadius}rem;
}
.dark {
  --primary: ${dark.primary};
  --primary-foreground: ${dark.primaryForeground};
  --ring: ${dark.ring};
  --sidebar-primary: ${dark.primary};
  --sidebar-primary-foreground: ${dark.primaryForeground};
}`.trim();
}
