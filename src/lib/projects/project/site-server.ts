import { cookies, headers } from "next/headers";

import {
  getLocaleOverride,
  getProjectLocaleFromSettings,
  getDirection,
  projectLocaleOverrideCookieName,
  projectLocaleOverrideHeaderName,
  projectVisiblePathnameHeaderName,
} from "@/lib/projects/project/site";

export async function getProjectRequestContext(
  domainId: string,
  generalSettings?: unknown,
) {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const visiblePathname =
    requestHeaders.get(projectVisiblePathnameHeaderName) ?? `/site/${domainId}`;
  const localeOverride =
    getLocaleOverride(requestHeaders.get(projectLocaleOverrideHeaderName)) ??
    getLocaleOverride(cookieStore.get(projectLocaleOverrideCookieName)?.value);
  const locale =
    localeOverride ?? getProjectLocaleFromSettings(generalSettings);

  return {
    dir: getDirection(locale),
    locale,
    localeOverride,
    visiblePathname,
  };
}
