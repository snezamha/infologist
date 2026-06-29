import { locales, type Locale } from "@/i18n/config";
import { stripLocalePrefixes } from "@/i18n/pathname";

function startsWithLocale(pathname: string) {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

export function localizedPath(locale: Locale, pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (startsWithLocale(normalized)) {
    return normalized;
  }

  const stripped = stripLocalePrefixes(normalized);

  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

export function getAuthPath(locale: Locale, callbackUrl?: string) {
  const path = localizedPath(locale, "/auth");

  if (!callbackUrl) {
    return path;
  }

  const params = new URLSearchParams({ callbackUrl });

  return `${path}?${params.toString()}`;
}

export function sanitizeCallbackUrl(value: unknown, locale: Locale) {
  const fallback = localizedPath(locale, "/dashboard");

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  const stripped = stripLocalePrefixes(trimmed);

  if (
    stripped === "/auth" ||
    stripped.startsWith("/auth/") ||
    stripped.startsWith("/api/")
  ) {
    return fallback;
  }

  return localizedPath(locale, stripped);
}
