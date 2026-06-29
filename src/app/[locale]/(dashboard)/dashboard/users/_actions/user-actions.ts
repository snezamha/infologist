"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/config";
import { requirePermission } from "@/lib/auth/rbac";
import { ActionError } from "@/lib/errors/action-error";
import { DEFAULT_PAGE_SIZE, getPageSlice } from "@/lib/pagination";
import { getPrisma, runSerializableTransaction } from "@/lib/prisma";
import { roles } from "@/lib/users/role-values";
import {
  assertLastSuperAdminPreserved,
  assertSuperAdminRoleChange,
} from "@/lib/users/super-admin-policy";
import {
  userEditorSchema,
  userListQuerySchema,
} from "@/lib/validation/schemas";

import type { DashboardUser } from "@/app/[locale]/(dashboard)/dashboard/users/_types/user";

function revalidateUsersPaths(userId?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/users`);

    if (userId) {
      revalidatePath(`/${locale}/dashboard/users/${userId}/edit`);
    }
  }
}

export type UserEditorRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  emailVerified: Date | null;
  hasGoogleAccount: boolean;
};

export type PaginatedUsers = {
  items: DashboardUser[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getUsers(
  options: {
    page?: number;
    pageSize?: number;
    query?: string;
  } = {},
): Promise<PaginatedUsers> {
  await requirePermission("users.read");

  const parsed = userListQuerySchema.parse({
    page: options.page ?? 1,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    query: options.query ?? "",
  });

  const { skip, take } = getPageSlice(parsed.page, parsed.pageSize);
  const prisma = getPrisma();
  const query = parsed.query.trim();

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
      },
      orderBy: { id: "asc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

export async function getUserById(userId: string) {
  await requirePermission("users.manage");

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ActionError("NOT_FOUND", "Not found");
  }

  const { accounts, ...profile } = user;

  const record: UserEditorRecord = {
    ...profile,
    hasGoogleAccount: accounts.length > 0,
  };

  return record;
}

export async function updateUserRole(userId: string, role: Role) {
  const session = await requirePermission("users.manage");
  if (userId === session.user.id) {
    throw new ActionError("FORBIDDEN", "Cannot update yourself");
  }
  if (!roles.includes(role)) {
    throw new ActionError("VALIDATION", "Invalid role");
  }

  await runSerializableTransaction(async (transaction) => {
    await assertSuperAdminRoleChange(transaction, userId, role);
    await transaction.user.update({ where: { id: userId }, data: { role } });
  });
  revalidateUsersPaths(userId);
}

export async function deleteUser(userId: string) {
  const session = await requirePermission("users.manage");
  if (userId === session.user.id) {
    throw new ActionError("FORBIDDEN", "Cannot delete yourself");
  }

  await runSerializableTransaction(async (transaction) => {
    await assertLastSuperAdminPreserved(transaction, userId);
    await transaction.user.delete({ where: { id: userId } });
  });
  revalidateUsersPaths(userId);
}

export async function updateUser(
  userId: string,
  data: {
    name: string;
    email: string;
    role: Role;
  },
) {
  const session = await requirePermission("users.manage");
  if (userId === session.user.id) {
    throw new ActionError("FORBIDDEN", "Cannot update yourself");
  }

  const parsed = userEditorSchema.safeParse(data);
  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid user",
    );
  }

  await runSerializableTransaction(async (transaction) => {
    const currentUser = await transaction.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        accounts: {
          where: { provider: "google" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!currentUser) {
      throw new ActionError("NOT_FOUND", "Not found");
    }

    await assertSuperAdminRoleChange(transaction, userId, parsed.data.role);

    const hasGoogleAccount = currentUser.accounts.length > 0;
    const name = parsed.data.name || null;
    const nextEmail = hasGoogleAccount
      ? currentUser.email
      : parsed.data.email.trim().toLowerCase();

    if (!hasGoogleAccount) {
      if (!nextEmail) {
        throw new ActionError("VALIDATION", "Invalid email");
      }

      const existingUser = await transaction.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new ActionError("CONFLICT", "Email already exists");
      }
    }

    await transaction.user.update({
      where: { id: userId },
      data: {
        name,
        email: nextEmail,
        role: parsed.data.role,
        emailVerified: hasGoogleAccount ? undefined : null,
      },
    });
  });

  revalidateUsersPaths(userId);
}
