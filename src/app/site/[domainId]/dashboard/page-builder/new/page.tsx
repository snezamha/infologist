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
import { PageCreateView } from "@/features/page-builder/components/page-create-view";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function NewProjectPageBuilderPage({ params }: Props) {
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
        "/dashboard/page-builder/new",
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

  return <PageCreateView domainId={domainId} />;
}
