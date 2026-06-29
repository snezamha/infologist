import { locales, type Locale } from "./config.ts";

export function stripLocalePrefixes(pathname: string): string {
  let result = pathname || "/";

  while (true) {
    let stripped = false;

    for (const locale of locales) {
      const prefix = `/${locale}`;

      if (result === prefix) {
        result = "/";
        stripped = true;
        break;
      }

      if (result.startsWith(`${prefix}/`)) {
        result = result.slice(prefix.length) || "/";
        stripped = true;
        break;
      }
    }

    if (!stripped) {
      break;
    }
  }

  return result;
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  for (const locale of locales) {
    const prefix = `/${locale}`;

    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return locale;
    }
  }

  return null;
}

export function collapseDuplicateLocalePrefix(pathname: string): string | null {
  for (const locale of locales) {
    const duplicatePrefix = `/${locale}/${locale}`;

    if (
      pathname === duplicatePrefix ||
      pathname.startsWith(`${duplicatePrefix}/`)
    ) {
      return pathname.replace(duplicatePrefix, `/${locale}`);
    }
  }

  return null;
}

export function buildSwitchHref(
  pathname: string,
  searchParams: URLSearchParams | string = "",
): string {
  const base = stripLocalePrefixes(pathname);
  const query =
    typeof searchParams === "string" ? searchParams : searchParams.toString();

  return query ? `${base}?${query}` : base;
}
