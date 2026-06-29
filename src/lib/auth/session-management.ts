import { cookies, headers } from "next/headers";
import { UAParser } from "ua-parser-js";

import { getPrisma } from "@/lib/prisma";
import { getSessionCookieName } from "@/lib/auth/session-cookies";

const SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

export function getSessionTokenFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): string | undefined {
  const secure = process.env.NODE_ENV === "production";
  const base = getSessionCookieName(secure);

  const direct = cookieStore.get(base);
  if (direct) return direct.value;

  const chunks: string[] = [];
  let i = 0;
  while (true) {
    const chunk = cookieStore.get(`${base}.${i}`);
    if (!chunk) break;
    chunks.push(chunk.value);
    i++;
  }

  return chunks.length > 0 ? chunks.join("") : undefined;
}

function describeUserAgent(ua: string | null) {
  if (!ua) {
    return { deviceLabel: "Unknown device", browserLabel: null, osLabel: null };
  }

  const result = UAParser(ua);
  const device = result.device;
  const browser = result.browser;
  const os = result.os;

  const deviceLabel =
    device.vendor && device.model
      ? `${device.vendor} ${device.model}`
      : device.type
        ? device.type.charAt(0).toUpperCase() + device.type.slice(1)
        : "Desktop";

  const browserLabel =
    browser.name && browser.version
      ? `${browser.name} ${browser.version}`
      : (browser.name ?? null);

  const osLabel =
    os.name && os.version ? `${os.name} ${os.version}` : (os.name ?? null);

  return { deviceLabel, browserLabel, osLabel };
}

export async function ensureTrackedSession(userId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = getSessionTokenFromCookies(cookieStore);

    if (!sessionToken) return;

    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent");
    const forwarded = requestHeaders.get("x-forwarded-for");
    const realIp = requestHeaders.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0]?.trim() ?? realIp ?? null;

    const expires = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000);

    await getPrisma().session.upsert({
      where: { sessionToken },
      create: {
        sessionToken,
        userId,
        expires,
        userAgent,
        ipAddress,
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        expires,
      },
    });
  } catch {}
}

export async function getTrackedSessions(userId: string) {
  const cookieStore = await cookies();
  const currentToken = getSessionTokenFromCookies(cookieStore);

  const sessions = await getPrisma().session.findMany({
    where: {
      userId,
      revokedAt: null,
      expires: { gt: new Date() },
    },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      sessionToken: true,
      userAgent: true,
      ipAddress: true,
      lastSeenAt: true,
      expires: true,
    },
  });

  return sessions.map((s) => {
    const { deviceLabel, browserLabel, osLabel } = describeUserAgent(
      s.userAgent,
    );
    return {
      id: s.id,
      isCurrent: s.sessionToken === currentToken,
      deviceLabel,
      browserLabel,
      osLabel,
      ipAddress: s.ipAddress,
      lastSeenAt: s.lastSeenAt,
      expires: s.expires,
    };
  });
}

export async function revokeTrackedSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  await getPrisma().session.updateMany({
    where: { id: sessionId, userId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeOtherTrackedSessions(
  userId: string,
): Promise<void> {
  const cookieStore = await cookies();
  const currentToken = getSessionTokenFromCookies(cookieStore);

  await getPrisma().session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(currentToken ? { sessionToken: { not: currentToken } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}
