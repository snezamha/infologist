import slugifyLib from "slugify";

import type { Locale } from "@/i18n/config";

export const latinSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const persianSlugPattern =
  /^[\p{Script=Arabic}\p{N}‌]+(?:-[\p{Script=Arabic}\p{N}‌]+)*$/u;

const MAX_SLUG_LENGTH = 120;

function slugifyLocale(locale?: Locale) {
  if (locale === "de") return "de";
  return undefined;
}

function slugifyPersian(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^؀-ۿ‌0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function slugifyValue(value: string, locale?: Locale) {
  if (locale === "fa") {
    return slugifyPersian(value);
  }

  return slugifyLib(value, {
    lower: true,
    strict: true,
    trim: true,
    locale: slugifyLocale(locale),
  }).slice(0, MAX_SLUG_LENGTH);
}

export function sanitizeSlug(value: string, locale?: Locale) {
  return slugifyValue(value, locale);
}

export function slugFromTitle(title: string, locale?: Locale) {
  return slugifyValue(title, locale);
}
