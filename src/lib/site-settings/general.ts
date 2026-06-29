import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import {
  dateFormatOptions,
  timeFormatOptions,
  timezoneOptions,
} from "./shared";

type DateFormat = (typeof dateFormatOptions)[number];
type TimeFormat = (typeof timeFormatOptions)[number];
type Timezone = (typeof timezoneOptions)[number];

export type GeneralSettings = {
  siteLanguage: Locale;
  timezone: Timezone;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
};

export const defaultGeneralSettings: GeneralSettings = {
  siteLanguage: defaultLocale,
  timezone: "UTC",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
};

function isOneOf<T extends readonly unknown[]>(
  options: T,
  value: unknown,
): value is T[number] {
  return options.includes(value);
}

export function parseGeneralSettings(value: unknown): GeneralSettings {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    siteLanguage: isOneOf(locales, record.siteLanguage)
      ? record.siteLanguage
      : defaultGeneralSettings.siteLanguage,
    timezone: isOneOf(timezoneOptions, record.timezone)
      ? record.timezone
      : defaultGeneralSettings.timezone,
    dateFormat: isOneOf(dateFormatOptions, record.dateFormat)
      ? record.dateFormat
      : defaultGeneralSettings.dateFormat,
    timeFormat: isOneOf(timeFormatOptions, record.timeFormat)
      ? record.timeFormat
      : defaultGeneralSettings.timeFormat,
  };
}

export function generalSettingsToFlat(settings: GeneralSettings) {
  return {
    siteLanguage: settings.siteLanguage,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
  };
}

export function flatToGeneralSettings(flat: {
  siteLanguage: Locale;
  timezone: Timezone;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}): GeneralSettings {
  return parseGeneralSettings(flat);
}
