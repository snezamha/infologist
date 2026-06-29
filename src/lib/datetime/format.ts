import type { Locale } from "@/i18n/config";
import type {
  dateFormatOptions,
  timeFormatOptions,
  timezoneOptions,
} from "@/lib/site-settings/shared";

export type DateFormat = (typeof dateFormatOptions)[number];
export type TimeFormat = (typeof timeFormatOptions)[number];
export type Timezone = (typeof timezoneOptions)[number];

export type DateTimePreferences = {
  locale: Locale;
  timezone: Timezone;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
};

export function getDateTimePreferences(
  settings: {
    timezone: Timezone;
    dateFormat: DateFormat;
    timeFormat: TimeFormat;
  },
  locale: Locale,
): DateTimePreferences {
  return {
    locale,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
  };
}

function partsToMap(parts: Intl.DateTimeFormatPart[]) {
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatToParts(
  date: Date,
  prefs: DateTimePreferences,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(prefs.locale, {
    timeZone: prefs.timezone,
    ...options,
  }).formatToParts(date);
}

export function formatSiteDate(date: Date, prefs: DateTimePreferences): string {
  switch (prefs.dateFormat) {
    case "YYYY-MM-DD": {
      const map = partsToMap(
        formatToParts(date, prefs, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      );
      return `${map.year}-${map.month}-${map.day}`;
    }
    case "DD/MM/YYYY": {
      const map = partsToMap(
        formatToParts(date, prefs, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      );
      return `${map.day}/${map.month}/${map.year}`;
    }
    case "MM/DD/YYYY": {
      const map = partsToMap(
        formatToParts(date, prefs, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      );
      return `${map.month}/${map.day}/${map.year}`;
    }
    case "D MMMM YYYY": {
      const map = partsToMap(
        formatToParts(date, prefs, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
      return `${map.day} ${map.month} ${map.year}`;
    }
    case "MMMM D, YYYY": {
      const map = partsToMap(
        formatToParts(date, prefs, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
      return `${map.month} ${map.day}, ${map.year}`;
    }
  }
}

export function formatSiteTime(date: Date, prefs: DateTimePreferences): string {
  const hour12 = prefs.timeFormat === "hh:mm A";
  const map = partsToMap(
    formatToParts(date, prefs, {
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    }),
  );

  if (!hour12) {
    return `${map.hour}:${map.minute}`;
  }

  return `${map.hour}:${map.minute} ${map.dayPeriod ?? ""}`.trim();
}

export function formatSiteDateTime(
  date: Date,
  prefs: DateTimePreferences,
): string {
  return `${formatSiteDate(date, prefs)} ${formatSiteTime(date, prefs)}`;
}

export function coerceDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}
