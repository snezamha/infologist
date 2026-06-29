import { redirect } from "next/navigation";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectFeatures } from "@/features/_core/lib";
import { projectSiteCopy } from "@/lib/projects/project/copy";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { getProjectUrl } from "@/lib/projects/project/domain";
import { getProjectMediaUsageStatsForUser } from "@/features/media/lib";
import {
  getProjectWidgetDefaultLayout,
  getProjectWidgetIds,
} from "@/lib/projects/project/_dashboard/core-widgets";
import { listProjectModulesForProject } from "@/lib/projects/modules";
import { DashboardView } from "@/components/dashboard/dashboard-view";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function ProjectDashboardPage({ params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, features, allModules] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectFeatures(project.id),
    listProjectModulesForProject(project.id),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);
  const copy = projectSiteCopy[context.locale].dashboard;
  const mediaEnabled = features.mediaManagement.enabled;
  const statisticsEnabled = features.statistics.enabled;
  const dashboardModules = allModules.filter(
    (module) => module.active && module.widget,
  );
  const moduleWidgetKeys = dashboardModules.map((module) => module.key);
  const widgetIds = getProjectWidgetIds({
    mediaEnabled,
    statisticsEnabled,
    moduleWidgetKeys,
  });
  const domainWidgetId = "project:domain_status";
  const mediaWidgetId = "project:media_usage_rate";
  const statisticsWidgetId = "project:statistics_analytics";
  const temporaryDomain = new URL(getProjectUrl(project.publicId)).hostname;
  const currentDomainType =
    domainId === project.customDomain ? "custom" : "temporary";
  const mediaUsage = mediaEnabled
    ? await getProjectMediaUsageStatsForUser(project.id, user?.id ?? null)
    : null;
  const widgetTitles = {
    [domainWidgetId]: copy.widgets.domainStatus.name,
    ...(mediaEnabled ? { [mediaWidgetId]: copy.widgets.mediaUsage.name } : {}),
    ...(statisticsEnabled
      ? { [statisticsWidgetId]: copy.widgets.statisticsAnalytics.name }
      : {}),
    ...Object.fromEntries(
      dashboardModules.map((module) => [
        `module:${module.key}`,
        module.title[context.locale],
      ]),
    ),
  };
  const widgetProps = {
    [domainWidgetId]: {
      projectName: project.name,
      projectStatus: project.status,
      currentDomainType,
      temporaryDomain,
      customDomain: project.customDomain,
      customDomainVerified: !!project.customDomainVerifiedAt,
      copy: copy.widgets.domainStatus,
    },
    ...(mediaEnabled && mediaUsage
      ? {
          [mediaWidgetId]: {
            usedBytes: mediaUsage.usedBytes,
            maxBytes: mediaUsage.maxBytes,
            copy: copy.widgets.mediaUsage,
          },
        }
      : {}),
    ...(statisticsEnabled
      ? {
          [statisticsWidgetId]: {
            projectId: project.id,
            copy: copy.widgets.statisticsAnalytics,
          },
        }
      : {}),
    ...Object.fromEntries(
      moduleWidgetKeys.map((key) => [
        `module:${key}`,
        {
          projectPublicId: project.publicId,
          basePath: `/modules/${key}`,
        },
      ]),
    ),
  };
  const welcomeName = user?.name ?? user?.email ?? "";

  return (
    <DashboardView
      title={copy.home.overview}
      description={copy.home.welcome.replace("{name}", welcomeName)}
      activeWidgetIds={widgetIds}
      widgetTitles={widgetTitles}
      widgetProps={widgetProps}
      dashboardLayoutStorageKey={`project-dashboard-layout:${project.id}:${user?.id ?? "guest"}`}
      defaultLayout={{
        items: getProjectWidgetDefaultLayout({
          mediaEnabled,
          statisticsEnabled,
          moduleWidgetKeys,
        }),
        hidden: [],
      }}
      widgetLabels={{
        customize: copy.widgets.customize,
        empty: copy.widgets.empty,
        expand: copy.widgets.expand,
        collapse: copy.widgets.collapse,
      }}
      showEmptyState
    />
  );
}
