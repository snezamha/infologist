import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";

import { getClientIpFromHeaders } from "@/lib/auth/sign-in-policy";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { defaultLocale } from "@/i18n/config";
import {
  collapseDuplicateLocalePrefix,
  getLocaleFromPathname,
  stripLocalePrefixes,
} from "@/i18n/pathname";
import { getAuthPath, localizedPath } from "@/lib/auth/callback-url";
import {
  getProjectDomainIdFromHost,
  getCustomDomainFromHost,
} from "@/lib/projects/project/domain";
import {
  projectLocaleOverrideCookieName,
  projectLocaleOverrideHeaderName,
  projectVisiblePathnameHeaderName,
  getLocaleOverride,
} from "@/lib/projects/project/site";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/dashboard"];
const authPaths = ["/auth"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const domainId = getProjectDomainIdFromHost(
    request.headers.get("host") ?? request.nextUrl.host,
  );

  if (domainId) {
    const pathnameLocale = getLocaleFromPathname(pathname);
    const cookieLocale = getLocaleOverride(
      request.cookies.get(projectLocaleOverrideCookieName)?.value,
    );
    const localeOverride = pathnameLocale ?? cookieLocale;
    const externalPathname = pathname;
    const pathnameWithoutLocale = stripLocalePrefixes(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/site/${domainId}${pathnameWithoutLocale}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(projectVisiblePathnameHeaderName, externalPathname);

    if (localeOverride) {
      requestHeaders.set(projectLocaleOverrideHeaderName, localeOverride);
    } else {
      requestHeaders.delete(projectLocaleOverrideHeaderName);
    }

    const response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    if (localeOverride) {
      response.cookies.set(projectLocaleOverrideCookieName, localeOverride, {
        path: "/",
      });
    }

    return response;
  }

  const customDomainHost = getCustomDomainFromHost(
    request.headers.get("host") ?? request.nextUrl.host,
  );

  if (customDomainHost) {
    const pathnameLocale = getLocaleFromPathname(pathname);
    const cookieLocale = getLocaleOverride(
      request.cookies.get(projectLocaleOverrideCookieName)?.value,
    );
    const localeOverride = pathnameLocale ?? cookieLocale;
    const externalPathname = pathname;
    const pathnameWithoutLocaleForSite = stripLocalePrefixes(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/site/${customDomainHost}${pathnameWithoutLocaleForSite}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(projectVisiblePathnameHeaderName, externalPathname);

    if (localeOverride) {
      requestHeaders.set(projectLocaleOverrideHeaderName, localeOverride);
    } else {
      requestHeaders.delete(projectLocaleOverrideHeaderName);
    }

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });

    if (localeOverride) {
      response.cookies.set(projectLocaleOverrideCookieName, localeOverride, {
        path: "/",
      });
    }

    return response;
  }

  const pathnameWithoutLocale = stripLocalePrefixes(pathname);

  const collapsedPathname = collapseDuplicateLocalePrefix(pathname);

  if (collapsedPathname) {
    const url = request.nextUrl.clone();
    url.pathname = collapsedPathname;
    return NextResponse.redirect(url);
  }

  if (
    authPaths.some(
      (path) =>
        pathnameWithoutLocale === path ||
        pathnameWithoutLocale.startsWith(`${path}/`),
    )
  ) {
    const ip = getClientIpFromHeaders(request.headers);
    const limit = await checkRateLimit(request, `auth:${ip}`, 20, 60_000);

    if (!limit.allowed) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      });
    }
  }

  if (pathname.match(/^\/site\/[^/]+\/auth(\/|$)/)) {
    const ip = getClientIpFromHeaders(request.headers);
    const limit = await checkRateLimit(
      request,
      `project-auth:${ip}`,
      20,
      60_000,
    );

    if (!limit.allowed) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      });
    }
  }

  if (
    protectedPrefixes.some((prefix) => pathnameWithoutLocale.startsWith(prefix))
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token?.sub) {
      const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
      const callbackUrl = localizedPath(
        locale,
        `${pathnameWithoutLocale}${request.nextUrl.search}`,
      );

      return NextResponse.redirect(
        new URL(getAuthPath(locale, callbackUrl), request.url),
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
