export const locales = ["en", "de", "fa"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const defaultTimeZone = "UTC";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fa: "فارسی",
};

const rtlLocales: readonly Locale[] = ["fa"];

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
