import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectNavigationState } from "@/lib/projects/navigation-state.server";
import { projectSiteCopy } from "@/lib/projects/project/copy";
import { buildProjectHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { ProjectLoadingView } from "./_components/project-loading-view";
import { ProjectShell } from "./_components/project-shell";

type Props = {
  children: ReactNode;
  params: Promise<{ domainId: string }>;
};

export default async function ProjectDashboardLayout({
  children,
  params,
}: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);

  if (!project) redirect("/");

  const [settings, navigation] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectNavigationState(project.id),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);

  const user = await getProjectSession(project.id, domainId);
  if (!user)
    redirect(buildProjectHref(domainId, context.visiblePathname, "/auth"));

  return (
    <ProjectShell
      domainId={domainId}
      copy={projectSiteCopy[context.locale]}
      dir={context.dir}
      locale={context.locale}
      initialNavigation={navigation}
      projectName={project.name}
      user={user}
    >
      <Suspense fallback={<ProjectLoadingView settings={settings} />}>
        {children}
      </Suspense>
    </ProjectShell>
  );
}
