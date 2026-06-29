import type { Role } from "@prisma/client";

export type Permission =
  | "users.read"
  | "users.manage"
  | "settings.read"
  | "settings.manage"
  | "projects.read"
  | "projects.manage";

const rolePermissions: Record<Role, readonly Permission[]> = {
  super_admin: [
    "users.read",
    "users.manage",
    "settings.read",
    "settings.manage",
    "projects.read",
    "projects.manage",
  ],
  admin: ["settings.read", "settings.manage", "projects.read"],
  user: [],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
