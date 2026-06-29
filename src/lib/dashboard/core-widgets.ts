import type { ComponentType } from "react";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/auth/permissions";

export const CORE_WIDGET_LOADERS: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  "core:user_overview": async () => {
    const { UserOverviewWidget } =
      await import("@/lib/dashboard/widgets/user-overview-widget");
    return { default: UserOverviewWidget };
  },
};

export const CORE_WIDGET_TITLE_KEYS: Record<
  string,
  [namespace: string, key: string]
> = {
  "core:user_overview": ["dashboard", "widgets.userOverview.name"],
};

export function getCoreWidgetIdsForRole(role: Role): string[] {
  const ids: string[] = [];
  if (hasPermission(role, "users.read")) ids.push("core:user_overview");
  return ids;
}

const CORE_WIDGET_DEFAULT_LAYOUT: Array<{
  id: string;
  permission: Parameters<typeof hasPermission>[1];
  full: boolean;
}> = [{ id: "core:user_overview", permission: "users.read", full: false }];

export function getCoreWidgetDefaultLayout(
  role: Role,
): Array<{ id: string; full: boolean; minimized: boolean }> {
  return CORE_WIDGET_DEFAULT_LAYOUT.filter((w) =>
    hasPermission(role, w.permission),
  ).map(({ id, full }) => ({ id, full, minimized: false }));
}
