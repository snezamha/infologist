import { z } from "zod";

export type PageTheme = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  fontSans: string;
  fontSizeBase: number;
  fontWeightNormal: number;
  fontWeightBold: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  spacingSm: number;
  spacingMd: number;
  spacingLg: number;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
};

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const safeCssValue = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[^;{}]+$/);

export const pageThemeSchema = z.object({
  primary: color,
  primaryForeground: color,
  secondary: color,
  background: color,
  foreground: color,
  muted: color,
  mutedForeground: color,
  border: color,
  fontSans: safeCssValue,
  fontSizeBase: z.number().min(10).max(20),
  fontWeightNormal: z.number().min(300).max(500),
  fontWeightBold: z.number().min(600).max(900),
  radiusSm: z.number().min(0).max(16),
  radiusMd: z.number().min(0).max(24),
  radiusLg: z.number().min(0).max(32),
  spacingSm: z.number().min(4).max(24),
  spacingMd: z.number().min(8).max(48),
  spacingLg: z.number().min(16).max(96),
  shadowSm: safeCssValue,
  shadowMd: safeCssValue,
  shadowLg: safeCssValue,
});

export const DEFAULT_PAGE_THEME: PageTheme = {
  primary: "#18181b",
  primaryForeground: "#fafafa",
  secondary: "#f4f4f5",
  background: "#ffffff",
  foreground: "#09090b",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  border: "#e4e4e7",
  fontSans: "'Inter', sans-serif",
  fontSizeBase: 14,
  fontWeightNormal: 400,
  fontWeightBold: 700,
  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 12,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 32,
  shadowSm: "0 1px 3px rgba(0,0,0,0.1)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.1)",
  shadowLg: "0 10px 30px rgba(0,0,0,0.15)",
};

export function themeToCSS(theme: PageTheme): string {
  return `
:root {
  --primary: ${theme.primary};
  --primary-foreground: ${theme.primaryForeground};
  --secondary: ${theme.secondary};
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --muted: ${theme.muted};
  --muted-foreground: ${theme.mutedForeground};
  --border: ${theme.border};
  --font-sans: ${theme.fontSans};
  --font-size-base: ${theme.fontSizeBase}px;
  --font-weight-normal: ${theme.fontWeightNormal};
  --font-weight-bold: ${theme.fontWeightBold};
  --radius-sm: ${theme.radiusSm}px;
  --radius-md: ${theme.radiusMd}px;
  --radius-lg: ${theme.radiusLg}px;
  --spacing-sm: ${theme.spacingSm}px;
  --spacing-md: ${theme.spacingMd}px;
  --spacing-lg: ${theme.spacingLg}px;
  --shadow-sm: ${theme.shadowSm};
  --shadow-md: ${theme.shadowMd};
  --shadow-lg: ${theme.shadowLg};
}
`.trim();
}

export function parseThemeData(
  raw: Record<string, unknown> | null | undefined,
): PageTheme {
  if (!raw) return DEFAULT_PAGE_THEME;
  const parsed = pageThemeSchema.safeParse({ ...DEFAULT_PAGE_THEME, ...raw });
  return parsed.success ? parsed.data : DEFAULT_PAGE_THEME;
}
