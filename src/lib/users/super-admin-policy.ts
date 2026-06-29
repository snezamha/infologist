import type { Prisma, Role } from "@prisma/client";

import { ActionError } from "@/lib/errors/action-error";

export async function assertLastSuperAdminPreserved(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "super_admin") {
    return;
  }

  const superAdminCount = await transaction.user.count({
    where: { role: "super_admin" },
  });

  if (superAdminCount <= 1) {
    throw new ActionError("FORBIDDEN", "LAST_SUPER_ADMIN");
  }
}

export async function assertSuperAdminRoleChange(
  transaction: Prisma.TransactionClient,
  userId: string,
  nextRole: Role,
) {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "super_admin" && nextRole !== "super_admin") {
    await assertLastSuperAdminPreserved(transaction, userId);
  }
}
