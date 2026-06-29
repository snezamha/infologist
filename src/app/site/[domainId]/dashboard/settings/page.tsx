import { redirect } from "next/navigation";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectSettings } from "@/lib/projects/project/settings";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { projectSiteCopy } from "@/lib/projects/project/copy";
import { buildProjectHref } from "@/lib/projects/project/site";
import { SiteSettingsView } from "./_components/site-settings-view";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function ProjectSettingsPage({ params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, projectSettings] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectSettings(project.id),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);
  const copy = projectSiteCopy[context.locale];

  if (!user) {
    redirect(buildProjectHref(domainId, context.visiblePathname, "/auth"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {copy.navigation.settings}
        </h1>
      </div>
      <SiteSettingsView
        domainId={domainId}
        publicId={project.publicId}
        initialSettings={projectSettings}
        initialCustomDomain={project.customDomain}
        initialCustomDomainVerifiedAt={project.customDomainVerifiedAt}
      />
    </div>
  );
}
