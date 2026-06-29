import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectFeatures } from "@/features/_core/lib";
import {
  buildProjectAuthHref,
  buildProjectHref,
} from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { parsePage, parseQuery } from "@/lib/pagination";
import { getPages } from "@/features/page-builder/actions";
import { PageView } from "@/features/page-builder/components/page-view";
import { parsePageStatus } from "@/features/page-builder/types";

type Props = {
  params: Promise<{ domainId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectPageBuilderPage({
  params,
  searchParams,
}: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, features] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectFeatures(project.id),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);
  const t = await getTranslations({
    locale: context.locale,
    namespace: "pageBuilder",
  });

  if (!user) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        "/dashboard/page-builder",
      ),
    );
  }

  if (!features.pageBuilder.enabled) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t("title")}
          description={t("disabledDescription")}
        />
        <DashboardSectionCard title={t("disabledTitle")}>
          <Button
            nativeButton={false}
            render={
              <a
                href={buildProjectHref(
                  domainId,
                  context.visiblePathname,
                  "/dashboard",
                )}
              />
            }
          >
            {t("enableFeature")}
          </Button>
        </DashboardSectionCard>
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams.page);
  const query = parseQuery(resolvedSearchParams.q);
  const status = parsePageStatus(parseQuery(resolvedSearchParams.status));

  const result = await getPages(domainId, { page, query, status });

  return (
    <PageView
      domainId={domainId}
      pages={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={query}
      status={status}
    />
  );
}
