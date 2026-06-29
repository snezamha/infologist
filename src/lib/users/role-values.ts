import type { Role } from "@prisma/client";

export type { Role };

export const roles = [
  "super_admin",
  "admin",
  "user",
] as const satisfies readonly Role[];
