import {
  FolderKanban,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import type { Role } from "@/lib/users/role";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { getSettingsSectionHref } from "@/lib/site-settings/sections";

type NavItemAccess = "all" | Permission;

export type NavItem = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  access?: NavItemAccess;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  roles?: Role[];
  children?: NavItem[];
  matchActive?: (pathname: string, searchParams: URLSearchParams) => boolean;
};

export type NavSection = {
  id: string;
  label?: string;
  items: NavItem[];
};

type SidebarNavLabels = {
  dashboard: string;
  profile: string;
  users: string;
  projects: string;
  settings: string;
};

function canAccessNavItem(
  role: Role,
  access: NavItemAccess = "all",
  roles?: Role[],
) {
  if (role === "super_admin") return true;
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return false;
  }
  if (access === "all") return true;
  return hasPermission(role, access);
}

export function filterNavItemsByRole(items: NavItem[], role: Role): NavItem[] {
  return items
    .filter((item) => canAccessNavItem(role, item.access, item.roles))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: filterNavItemsByRole(item.children, role),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}

export function getCoreSidebarNavItems(labels: SidebarNavLabels): NavItem[] {
  return [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: labels.dashboard,
      access: "all",
    },
    {
      href: "/dashboard/profile",
      icon: UserRound,
      label: labels.profile,
      access: "all",
    },
    {
      href: "/dashboard/users",
      icon: Users,
      label: labels.users,
      access: "users.read",
    },
    {
      href: "/dashboard/projects",
      icon: FolderKanban,
      label: labels.projects,
      access: "projects.read",
      matchActive: (pathname) =>
        pathname === "/dashboard/projects" ||
        /^\/dashboard\/projects\/[^/]+$/.test(pathname),
    },
    {
      href: getSettingsSectionHref("appearance"),
      icon: Settings,
      label: labels.settings,
      access: "settings.read",
    },
  ];
}
