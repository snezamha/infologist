import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/rbac";
import { getRequestLocale } from "@/i18n/locale";
import { localizedPath } from "@/lib/auth/callback-url";

import {
  getUserById,
  type UserEditorRecord,
} from "@/app/[locale]/(dashboard)/dashboard/users/_actions/user-actions";
import { UserEditView } from "./_components/user-edit-view";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "users" });
  return { title: t("title") };
}

export default async function UserEditPage({ params }: Props) {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await requirePermission("users.manage");
  const { userId } = await params;

  if (userId === session.user.id) {
    redirect(localizedPath(locale, "/dashboard/profile"));
  }

  let user: UserEditorRecord;

  try {
    user = await getUserById(userId);
  } catch {
    notFound();
  }

  return <UserEditView user={user} />;
}
