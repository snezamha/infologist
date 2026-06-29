"use server";

import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/config";
import { getSession } from "@/lib/auth/get-session";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma, runSerializableTransaction } from "@/lib/prisma";
import type { Role } from "@/lib/users/role";
import { assertLastSuperAdminPreserved } from "@/lib/users/super-admin-policy";
import {
  getTrackedSessions,
  revokeOtherTrackedSessions,
  revokeTrackedSession,
} from "@/lib/auth/session-management";

export type ProfileFormData = {
  name: string;
  email: string;
};

export type ProfileSession = Awaited<
  ReturnType<typeof getTrackedSessions>
>[number];

export type ProfileSecurity = {
  sessions: ProfileSession[];
};

export type ProfileErrorKey =
  | "unauthorized"
  | "notFound"
  | "invalidEmail"
  | "emailConflict"
  | "emailConfirmMismatch";

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    throw new ActionError("VALIDATION", "invalidEmail");
  }

  const email = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ActionError("VALIDATION", "invalidEmail");
  }

  return email;
}

function toProfileResponse(user: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
  accounts: { id: string }[];
}) {
  const { accounts, ...profile } = user;

  return {
    ...profile,
    hasGoogleAccount: accounts.length > 0,
  };
}

async function syncGoogleEmailVerification(userId: string) {
  return getPrisma().user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      lastLoginAt: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function getCurrentProfile() {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      lastLoginAt: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  if (user.accounts.length > 0 && !user.emailVerified) {
    return toProfileResponse(
      await syncGoogleEmailVerification(session.user.id),
    );
  }

  return toProfileResponse(user);
}

export async function updateProfile(data: ProfileFormData) {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const prisma = getPrisma();
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const hasGoogleAccount = currentUser.accounts.length > 0;
  const name = normalizeOptionalText(data.name, 120);
  const email = hasGoogleAccount
    ? currentUser.email
    : normalizeEmail(data.email);

  if (!hasGoogleAccount) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ActionError("CONFLICT", "emailConflict");
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      lastLoginAt: true,
      accounts: {
        where: { provider: "google" },
        select: { id: true },
        take: 1,
      },
    },
  });

  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard`, "layout");
  }

  return toProfileResponse(user);
}

export async function getProfileSecurity() {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const sessions = await getTrackedSessions(session.user.id);

  return { sessions };
}

export async function revokeSession(sessionId: string) {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const result = await revokeTrackedSession(session.user.id, sessionId);

  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/profile`);
  }

  return result;
}

export async function revokeOtherSessions() {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  await revokeOtherTrackedSessions(session.user.id);
  for (const locale of locales) {
    revalidatePath(`/${locale}/dashboard/profile`);
  }
}

export async function deleteCurrentAccount(confirmEmail: string) {
  const session = await getSession();

  if (!session) {
    throw new ActionError("UNAUTHORIZED", "unauthorized");
  }

  const prisma = getPrisma();
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!currentUser) {
    throw new ActionError("NOT_FOUND", "notFound");
  }

  const expectedEmail = currentUser.email?.trim().toLowerCase();
  if (!expectedEmail || confirmEmail.trim().toLowerCase() !== expectedEmail) {
    throw new ActionError("VALIDATION", "emailConfirmMismatch");
  }

  await runSerializableTransaction(async (transaction) => {
    await assertLastSuperAdminPreserved(transaction, currentUser.id);
    await transaction.user.delete({
      where: { id: currentUser.id },
    });
  });
}
