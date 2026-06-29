"use server";

import { getSession } from "@/lib/auth/get-session";
import { getPrisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["super_admin", "admin", "user"];

export async function getUserOverviewStats() {
  const session = await getSession();
  if (!session) return null;

  const prisma = getPrisma();
  const [total, grouped, currentUser] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastLoginAt: true },
    }),
  ]);

  return {
    total,
    roleCounts: ROLES.map((r) => ({
      role: r,
      count: grouped.find((entry) => entry.role === r)?._count.role ?? 0,
    })),
    lastLoginAt: currentUser?.lastLoginAt ?? null,
  };
}
