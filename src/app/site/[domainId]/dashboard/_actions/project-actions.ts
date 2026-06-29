"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClerkClient } from "@clerk/nextjs/server";

import { locales, type Locale } from "@/i18n/config";
import { projectLocaleOverrideCookieName } from "@/lib/projects/project/site";
import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getCachedProjectNavigationState } from "@/lib/projects/navigation-state.server";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { projectAdminHandoffCookieName } from "@/lib/projects/project/admin-handoff";

export async function setProjectLocaleOverride(locale: Locale) {
  if (!locales.includes(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(projectLocaleOverrideCookieName, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getLiveProjectNavigationState(domainId: string) {
  const project = await getPublicProject(domainId);
  if (!project) throw new Error("Project not found");

  const user = await getProjectSession(project.id, domainId);
  if (!user) throw new Error("Unauthorized");

  return getCachedProjectNavigationState(project.id);
}

export async function signOutFromProject(domainId: string) {
  const project = await getPublicProject(domainId);
  if (!project) throw new Error("Project not found");

  const config = await getProjectConfig(project.id);
  const cookieStore = await cookies();

  // Clear handoff token if present
  cookieStore.delete(projectAdminHandoffCookieName);

  // If Clerk is configured, sign out via Clerk
  if (config.clerkSecretKey && config.clerkPublishableKey) {
    try {
      const clerk = createClerkClient({
        secretKey: config.clerkSecretKey,
        publishableKey: config.clerkPublishableKey,
      });
      // Clerk sign-out is handled client-side via useClerk(), but we're on server
      // So we just clear the cookies and redirect
    } catch {
      // Fall through to redirect
    }
  }

  redirect(`/site/${domainId}/auth`);
}
