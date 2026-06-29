import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getRequestLocale } from "@/i18n/locale";
import { requireSession } from "@/lib/auth/rbac";
import {
  getCoreWidgetIdsForRole,
  getCoreWidgetDefaultLayout,
  CORE_WIDGET_TITLE_KEYS,
} from "@/lib/dashboard/core-widgets";
import type { Role } from "@prisma/client";

import { DashboardView } from "@/components/dashboard/dashboard-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const session = await requireSession();
  const role = session.user.role as Role;
  const activeWidgetIds = getCoreWidgetIdsForRole(role);
  const displayName = session.user.name ?? session.user.email ?? "";

  const widgetTitles = Object.fromEntries(
    await Promise.all(
      activeWidgetIds.map(async (widgetId) => {
        const [namespace, key] = CORE_WIDGET_TITLE_KEYS[widgetId];
        const t = await getTranslations({ locale, namespace });
        return [widgetId, t(key as never)] as const;
      }),
    ),
  ) as Record<string, string>;
  const defaultLayout = {
    items: [...getCoreWidgetDefaultLayout(role)],
    hidden: [] as string[],
  };

  return (
    <DashboardView
      title={t("home.overview")}
      description={t("home.welcome", { name: displayName })}
      activeWidgetIds={activeWidgetIds}
      widgetTitles={widgetTitles}
      dashboardLayoutStorageKey={`dashboard-layout:${session.user.id}`}
      defaultLayout={defaultLayout}
      widgetLabels={{
        customize: t("widgets.customize"),
        empty: t("widgets.empty"),
        expand: t("widgets.expand"),
        collapse: t("widgets.collapse"),
      }}
    />
  );
}
