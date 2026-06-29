import { redirect } from "next/navigation";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectFeatures } from "@/features/_core/lib";
import { buildProjectHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { projectSiteCopy } from "@/lib/projects/project/copy";
import { ProjectStatisticsView } from "@/features/statistics/_components/statistics-view";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function ProjectStatisticsPage({ params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, features] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectFeatures(project.id),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);

  if (!user) {
    redirect(buildProjectHref(domainId, context.visiblePathname, "/auth"));
  }

  if (!features.statistics.enabled) {
    redirect(buildProjectHref(domainId, context.visiblePathname, "/dashboard"));
  }

  const copy = projectSiteCopy[context.locale];

  return <ProjectStatisticsView domainId={domainId} copy={copy.statistics} />;
}
