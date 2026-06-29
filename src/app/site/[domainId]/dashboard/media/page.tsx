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
import { getProjectMediaLibrary } from "@/features/media/lib";
import { buildProjectHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { SiteProjectMediaView } from "@/features/media/_components/site-media-view";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function ProjectMediaPage({ params }: Props) {
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
    namespace: "media",
  });

  if (!user) {
    redirect(buildProjectHref(domainId, context.visiblePathname, "/auth"));
  }

  if (!features.mediaManagement.enabled) {
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

  const library = await getProjectMediaLibrary(project.id);

  return (
    <SiteProjectMediaView
      domainId={domainId}
      initialFiles={library.files}
      total={library.total}
    />
  );
}
