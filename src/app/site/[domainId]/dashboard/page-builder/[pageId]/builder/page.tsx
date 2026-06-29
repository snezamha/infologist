import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { isActionError } from "@/lib/errors/action-error";
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
import {
  getManagedHomepagePageId,
  getManagedPageById,
} from "@/features/page-builder/actions";
import { PageBuilderView } from "@/features/page-builder/components/page-builder-view";

type Props = {
  params: Promise<{ domainId: string; pageId: string }>;
};

export default async function ProjectPageBuilderEditorPage({ params }: Props) {
  const { domainId, pageId } = await params;
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
        `/dashboard/page-builder/${pageId}/builder`,
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

  const homepagePageId = await getManagedHomepagePageId(domainId);

  return (
    <PageBuilderView
      domainId={domainId}
      content={content}
      homepagePageId={homepagePageId}
    />
  );
}
