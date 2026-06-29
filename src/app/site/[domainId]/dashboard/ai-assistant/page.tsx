import { notFound, redirect } from "next/navigation";

import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import {
  buildProjectAuthHref,
  buildProjectHref,
} from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";

type Props = {
  params: Promise<{ domainId: string }>;
};

export default async function SiteProjectAiAssistantPage({ params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);

  if (!project) {
    notFound();
  }

  const [settings, user] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);
  const promptTemplatesPath = "/dashboard/ai-assistant/prompt-templates";

  if (!user) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        promptTemplatesPath,
      ),
    );
  }

  redirect(
    buildProjectHref(domainId, context.visiblePathname, promptTemplatesPath),
  );
}
