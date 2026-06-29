import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NotFoundView } from "@/components/not-found-view";
import { getRequestLocale } from "@/i18n/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.notFound");
  return { title: `404 – ${t("title")}` };
}

export default async function NotFound() {
  const locale = await getRequestLocale();
  const t = await getTranslations("common.notFound");

  return (
    <NotFoundView
      title={t("title")}
      description={t("description")}
      goBackLabel={t("goBack")}
      backHomeLabel={t("backHome")}
      homeHref={`/${locale}`}
    />
  );
}
