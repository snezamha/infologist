import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requirePermission } from "@/lib/auth/rbac";
import { getRequestLocale } from "@/i18n/locale";
import { getAppearanceSettings } from "@/lib/settings";

import { SettingsView } from "./_components/settings-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title") };
}

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  await requirePermission("settings.read");

  const settings = await getAppearanceSettings();
  return <SettingsView settings={settings} />;
}
