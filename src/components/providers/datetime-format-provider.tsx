"use client";

import { createContext, use, useMemo, type ReactNode } from "react";

import {
  coerceDate,
  formatSiteDate,
  formatSiteDateTime,
  formatSiteTime,
  type DateTimePreferences,
} from "@/lib/datetime/format";

type DateTimeFormatters = {
  preferences: DateTimePreferences;
  formatDate: (value: Date | string | number) => string;
  formatTime: (value: Date | string | number) => string;
  formatDateTime: (value: Date | string | number) => string;
};

const DateTimeFormatContext = createContext<DateTimeFormatters | null>(null);

type Props = {
  children: ReactNode;
  preferences: DateTimePreferences;
};

export function DateTimeFormatProvider({ children, preferences }: Props) {
  const formatters = useMemo<DateTimeFormatters>(
    () => ({
      preferences,
      formatDate: (value) => formatSiteDate(coerceDate(value), preferences),
      formatTime: (value) => formatSiteTime(coerceDate(value), preferences),
      formatDateTime: (value) =>
        formatSiteDateTime(coerceDate(value), preferences),
    }),
    [preferences],
  );

  return (
    <DateTimeFormatContext value={formatters}>{children}</DateTimeFormatContext>
  );
}

export function useSiteDateTimeFormat() {
  const context = use(DateTimeFormatContext);

  if (!context) {
    throw new Error(
      "useSiteDateTimeFormat must be used within DateTimeFormatProvider",
    );
  }

  return context;
}
