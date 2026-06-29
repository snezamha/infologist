import { notFound, redirect } from "next/navigation";

import { isActionError } from "@/lib/errors/action-error";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectFeatures } from "@/features/_core/lib";
import { getProjectMediaFile } from "@/features/media/lib";
import {
  buildProjectAuthHref,
  buildProjectHref,
} from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { SiteProjectMediaEditView } from "@/features/media/_components/admin-media-edit-view";

type Props = {
  params: Promise<{ domainId: string; mediaId: string }>;
};

export default async function ProjectMediaEditPage({ params }: Props) {
  const { domainId, mediaId } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, features] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectFeatures(project.id),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);

  if (!user) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        `/dashboard/media/${mediaId}/edit`,
      ),
    );
  }

  if (!features.mediaManagement.enabled) {
    redirect(
      buildProjectHref(domainId, context.visiblePathname, "/dashboard/media"),
    );
  }

  const file = await getProjectMediaFile(project.id, mediaId).catch((error) => {
    if (isActionError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <SiteProjectMediaEditView domainId={domainId} file={file} mode="edit" />
  );
}
