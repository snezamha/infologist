import { redirect } from "next/navigation";

import { getRequestLocale } from "@/i18n/locale";
import { getAuthPath, localizedPath } from "@/lib/auth/callback-url";
import { assertSuperAdmin, isSuperAdmin } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@/lib/users/role";

export type { Permission } from "@/lib/auth/permissions";
export { hasPermission } from "@/lib/auth/permissions";
export { assertSuperAdmin, isSuperAdmin } from "@/lib/auth/access";

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    const locale = await getRequestLocale();
    redirect(getAuthPath(locale));
  }

  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();

  if (!hasPermission(session.user.role as Role, permission)) {
    const locale = await getRequestLocale();
    redirect(localizedPath(locale, "/dashboard"));
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();

  if (!isSuperAdmin(session.user.role as Role)) {
    const locale = await getRequestLocale();
    redirect(localizedPath(locale, "/dashboard"));
  }

  return session;
}

export async function requireSuperAdminAction() {
  const session = await requireSession();
  assertSuperAdmin(session.user.role as Role);
  return session;
}
