import { headers, cookies } from "next/headers";
import { cache } from "react";
import { createClerkClient } from "@clerk/nextjs/server";

import { getPrisma } from "@/lib/prisma";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getUserRole } from "@/lib/users/get-user-role";
import { upsertProjectUserFromClerk } from "@/lib/projects/project/_db";
import { getSession } from "@/lib/auth/get-session";
import { isSuperAdmin } from "@/lib/auth/access";
import {
  projectAdminHandoffCookieName,
  verifyProjectAdminHandoffToken,
} from "@/lib/projects/project/admin-handoff";

export type ProjectSessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "admin" | "user";
};

async function getAppProjectSession(
  projectId: string,
): Promise<ProjectSessionUser | null> {
  const session = await getSession();

  if (!session?.user.id) return null;

  const [project, role] = await Promise.all([
    getPrisma().project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    }),
    getUserRole(session.user.id),
  ]);

  if (
    !project ||
    (project.ownerId !== session.user.id && !isSuperAdmin(role))
  ) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    role: "admin",
  };
}

async function getHandoffProjectSession(
  projectId: string,
): Promise<ProjectSessionUser | null> {
  const cookieStore = await cookies();
  const payload = verifyProjectAdminHandoffToken(
    cookieStore.get(projectAdminHandoffCookieName)?.value,
    projectId,
  );

  if (!payload) return null;

  const [project, user, role] = await Promise.all([
    getPrisma().project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    }),
    getPrisma().user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, image: true },
    }),
    getUserRole(payload.userId),
  ]);

  if (!project || !user) return null;
  if (project.ownerId !== user.id && !isSuperAdmin(role)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: "admin",
  };
}

async function getFallbackProjectSession(projectId: string) {
  return (
    (await getAppProjectSession(projectId)) ??
    (await getHandoffProjectSession(projectId))
  );
}

export const getProjectSession = cache(
  async (
    projectId: string,
    domainId: string,
  ): Promise<ProjectSessionUser | null> => {
    void domainId;

    const config = await getProjectConfig(projectId);

    if (!config.clerkPublishableKey || !config.clerkSecretKey) {
      return getFallbackProjectSession(projectId);
    }

    const requestHeaders = await headers();
    const cookieStore = await cookies();

    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const syntheticHeaders = new Headers();
    const host =
      requestHeaders.get("x-forwarded-host") ??
      requestHeaders.get("host") ??
      "localhost:3000";
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";

    syntheticHeaders.set("host", host);
    syntheticHeaders.set("cookie", cookieHeader);

    const url = `${proto}://${host}/`;

    const clerk = createClerkClient({
      secretKey: config.clerkSecretKey,
      publishableKey: config.clerkPublishableKey,
    });

    let userId: string | null | undefined;
    try {
      const authState = await clerk.authenticateRequest(
        new Request(url, { headers: syntheticHeaders }),
        {
          secretKey: config.clerkSecretKey,
          publishableKey: config.clerkPublishableKey,
        },
      );
      userId = authState.toAuth()?.userId;
    } catch {
      return getFallbackProjectSession(projectId);
    }

    if (!userId) return getFallbackProjectSession(projectId);

    try {
      const clerkUser = await clerk.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
      const name =
        clerkUser.fullName ??
        ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          null);
      const image = clerkUser.imageUrl ?? null;

      let role: "admin" | "user" = "user";

      if (config.databaseUrl && email) {
        const dbUser = await upsertProjectUserFromClerk(config.databaseUrl, {
          id: userId,
          email,
          name,
          image,
        }).catch(() => null);

        if (dbUser) {
          role = dbUser.role;
        }
      }

      if (role !== "admin" && email) {
        const prisma = getPrisma();
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { owner: { select: { email: true } } },
        });
        if (project?.owner?.email === email) {
          role = "admin";
        }
      }

      if (role !== "admin" && (await getUserRole(userId)) === "super_admin") {
        role = "admin";
      }

      return { id: userId, name, email, image, role };
    } catch {
      return getFallbackProjectSession(projectId);
    }
  },
);
