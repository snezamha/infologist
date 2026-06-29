import { getPrisma, runSerializableTransaction } from "@/lib/prisma";
import { roles, type Role } from "@/lib/users/role-values";

export { roles, type Role };

export async function assignRoleOnCreate(userId: string): Promise<Role> {
  return runSerializableTransaction(async (tx) => {
    const existingSuperAdmin = await tx.user.findFirst({
      where: { role: "super_admin" },
      select: { id: true },
    });

    if (existingSuperAdmin) {
      return "user";
    }

    await tx.user.update({
      where: { id: userId },
      data: { role: "super_admin" },
    });

    return "super_admin";
  });
}

export async function getUserRole(userId: string): Promise<Role> {
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? "user";
}
