import { redirect } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { projectSiteCopy } from "@/lib/projects/project/copy";
import { buildProjectHref } from "@/lib/projects/project/site";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function ProjectProfilePage({ params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
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
          {copy.navigation.profile}
        </h1>
      </div>
      <UserProfile routing="hash" />
    </div>
  );
}
