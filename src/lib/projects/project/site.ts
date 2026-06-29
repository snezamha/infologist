import {
  defaultLocale,
  getDirection,
  locales,
  type Locale,
} from "@/i18n/config";
import { getLocaleFromPathname } from "@/i18n/pathname";

export const projectLocaleOverrideCookieName = "project-locale-override";
export const projectLocaleOverrideHeaderName = "x-project-locale-override";
export const projectVisiblePathnameHeaderName = "x-project-visible-pathname";

type GeneralSettingsRecord = Record<string, unknown> | null;

function getGeneralSettingsRecord(value: unknown): GeneralSettingsRecord {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function getProjectLocaleFromSettings(value: unknown): Locale {
  const siteLanguage = getGeneralSettingsRecord(value)?.siteLanguage;
  return locales.includes(siteLanguage as Locale)
    ? (siteLanguage as Locale)
    : defaultLocale;
}

export function getProjectSiteName(value: unknown, fallback: string): string {
  const siteName = getGeneralSettingsRecord(value)?.siteName;
  return typeof siteName === "string" && siteName.trim().length > 0
    ? siteName.trim()
    : fallback;
}

function normalizeProjectTargetPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getProjectRouteBase(pathname: string, domainId: string): string {
  const internalBase = `/site/${domainId}`;

  if (pathname === internalBase || pathname.startsWith(`${internalBase}/`)) {
    return internalBase;
  }

  const locale = getLocaleFromPathname(pathname);
  return locale ? `/${locale}` : "";
}

export function buildProjectHref(
  domainId: string,
  pathname: string,
  targetPath: string,
): string {
  const base = getProjectRouteBase(pathname, domainId);
  const target = normalizeProjectTargetPath(targetPath);

  if (target === "/") {
    return base || "/";
  }

  return `${base}${target}`;
}

export function buildProjectAuthHref(
  domainId: string,
  pathname: string,
  callbackPath: string,
): string {
  const authHref = buildProjectHref(domainId, pathname, "/auth");
  const callbackUrl = buildProjectHref(domainId, pathname, callbackPath);
  return `${authHref}?${new URLSearchParams({ callbackUrl }).toString()}`;
}

export function getLocaleOverride(
  value: string | undefined | null,
): Locale | null {
  return locales.includes(value as Locale) ? (value as Locale) : null;
}

export { getDirection };
