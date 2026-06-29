import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

type SeoLocaleSettings = {
  title: string;
  description: string;
  separator: string;
};

export type SeoSettings = Record<Locale, SeoLocaleSettings>;

const defaultSeoLocale: SeoLocaleSettings = {
  title: "",
  description: "",
  separator: " | ",
};

export const defaultSeoSettings: SeoSettings = {
  en: { ...defaultSeoLocale },
  fa: { ...defaultSeoLocale },
  de: { ...defaultSeoLocale },
};

function parseSeoLocale(
  value: unknown,
  fallback: SeoLocaleSettings,
): SeoLocaleSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    title: typeof record.title === "string" ? record.title : fallback.title,
    description:
      typeof record.description === "string"
        ? record.description
        : fallback.description,
    separator:
      typeof record.separator === "string"
        ? record.separator
        : fallback.separator,
  };
}

export function parseSeoSettings(value: unknown): SeoSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return locales.reduce((acc, locale) => {
    acc[locale] = parseSeoLocale(record[locale], defaultSeoSettings[locale]);
    return acc;
  }, {} as SeoSettings);
}

export function seoSettingsToFlat(settings: SeoSettings) {
  return {
    seoTitleEn: settings.en.title,
    seoTitleFa: settings.fa.title,
    seoTitleDe: settings.de.title,
    seoDescriptionEn: settings.en.description,
    seoDescriptionFa: settings.fa.description,
    seoDescriptionDe: settings.de.description,
    seoSeparatorEn: settings.en.separator,
    seoSeparatorFa: settings.fa.separator,
    seoSeparatorDe: settings.de.separator,
  };
}

export function flatToSeoSettings(flat: {
  seoTitleEn: string;
  seoTitleFa: string;
  seoTitleDe: string;
  seoDescriptionEn: string;
  seoDescriptionFa: string;
  seoDescriptionDe: string;
  seoSeparatorEn: string;
  seoSeparatorFa: string;
  seoSeparatorDe: string;
}): SeoSettings {
  return {
    en: {
      title: flat.seoTitleEn,
      description: flat.seoDescriptionEn,
      separator: flat.seoSeparatorEn,
    },
    fa: {
      title: flat.seoTitleFa,
      description: flat.seoDescriptionFa,
      separator: flat.seoSeparatorFa,
    },
    de: {
      title: flat.seoTitleDe,
      description: flat.seoDescriptionDe,
      separator: flat.seoSeparatorDe,
    },
  };
}
