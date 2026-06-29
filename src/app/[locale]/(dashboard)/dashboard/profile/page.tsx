import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getRequestLocale } from "@/i18n/locale";
import { getAuthPath } from "@/lib/auth/callback-url";
import { getSession } from "@/lib/auth/get-session";

import {
  getCurrentProfile,
  getProfileSecurity,
} from "./_actions/profile-actions";
import { ProfileView } from "./_components/profile-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title") };
}

export default async function ProfilePage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await getSession();

  if (!session) {
    redirect(getAuthPath(locale));
  }

  const [profile, security] = await Promise.all([
    getCurrentProfile(),
    getProfileSecurity(),
  ]);

  return <ProfileView profile={profile} security={security} />;
}
