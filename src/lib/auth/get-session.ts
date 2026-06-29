import { cookies } from "next/headers";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { cache } from "react";

import { getSessionTokenFromCookies } from "@/lib/auth/session-management";
import { getUserRole } from "@/lib/users/get-user-role";
import { getPrisma } from "@/lib/prisma";

export const getSession = cache(async (): Promise<Session | null> => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    },
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.sub) {
    return null;
  }

  const tokenData = token as NonNullable<typeof token>;
  const sub = tokenData.sub as string;

  const sessionToken = getSessionTokenFromCookies(cookieStore);

  if (sessionToken) {
    try {
      const trackedSession = await getPrisma().session.findUnique({
        where: { sessionToken },
        select: {
          userId: true,
          revokedAt: true,
          expires: true,
        },
      });

      if (trackedSession) {
        if (
          trackedSession.userId !== sub ||
          trackedSession.revokedAt ||
          trackedSession.expires <= new Date()
        ) {
          return null;
        }
      }
    } catch {
      return null;
    }
  }

  const role = await getUserRole(sub);
  const user = await getPrisma().user.findUnique({
    where: { id: sub },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  return {
    expires: tokenData.exp
      ? new Date(Number(tokenData.exp) * 1000).toISOString()
      : new Date(0).toISOString(),
    user: {
      id: sub,
      role,
      name: user?.name ?? tokenData.name ?? null,
      email: user?.email ?? tokenData.email ?? null,
      image: user?.image ?? tokenData.picture ?? null,
    },
  };
});
