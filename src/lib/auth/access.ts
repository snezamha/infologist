import { ActionError } from "@/lib/errors/action-error";
import type { Role } from "@/lib/users/role";

export function isSuperAdmin(role: Role) {
  return role === "super_admin";
}

export function assertSuperAdmin(role: Role) {
  if (!isSuperAdmin(role)) {
    throw new ActionError("FORBIDDEN", "Unauthorized");
  }
}
