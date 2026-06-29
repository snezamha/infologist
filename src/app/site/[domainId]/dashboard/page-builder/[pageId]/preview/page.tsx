import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getManagedPageById } from "@/features/page-builder/actions";
import { PublicPageView } from "@/features/page-builder/frontend/public-page";
import { isActionError } from "@/lib/errors/action-error";
import { locales, type Locale } from "@/i18n/config";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { buildProjectHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";

type Props = {
  params: Promise<{ domainId: string; pageId: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function PageBuilderPreviewPage({
  params,
  searchParams,
}: Props) {
  const [{ domainId, pageId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const settings = await getPublicProjectSettings(project.id);
  const context = await getProjectRequestContext(domainId, settings.general);
  const locale = locales.includes(query.locale as Locale)
    ? (query.locale as Locale)
    : context.locale;
  const t = await getTranslations({ locale, namespace: "pageBuilder" });

  let content;
  try {
    content = await getManagedPageById(domainId, pageId);
  } catch (error) {
    if (
      isActionError(error) &&
      (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")
    ) {
      notFound();
    }
    throw error;
  }

  const builderHref = buildProjectHref(
    domainId,
    context.visiblePathname,
    `/dashboard/page-builder/${pageId}/builder`,
  );

  return (
    <div className="space-y-4">
      <div className="bg-background sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 shadow-sm">
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          render={<Link href={builderHref} />}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("preview.backToBuilder")}
        </Button>
        <div className="flex items-center gap-1">
          {locales.map((item) => (
            <Button
              key={item}
              nativeButton={false}
              variant={item === locale ? "default" : "ghost"}
              size="sm"
              render={<Link href={`?locale=${item}`} />}
            >
              {t(`locales.${item}`)}
            </Button>
          ))}
        </div>
      </div>
      <div
        dir={locale === "fa" ? "rtl" : "ltr"}
        className="overflow-hidden rounded-lg border"
      >
        <PublicPageView content={content} locale={locale} />
      </div>
    </div>
  );
}
