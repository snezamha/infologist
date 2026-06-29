import { notFound, redirect } from "next/navigation";

import { installedProjectModuleFrontends } from "@/features/modules";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectModuleKeys } from "@/lib/projects/modules";
import { buildProjectAuthHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";

type Props = {
  params: Promise<{ domainId: string; moduleName: string }>;
};

export default async function ProjectSiteModulePage({ params }: Props) {
  const { domainId, moduleName } = await params;
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, user, activeKeys] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    getProjectModuleKeys(project.id),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);

  if (!user) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        `/modules/${moduleName}`,
      ),
    );
  }

  if (!activeKeys.includes(moduleName)) notFound();

  const ModuleComponent =
    installedProjectModuleFrontends[
      moduleName as keyof typeof installedProjectModuleFrontends
    ];

  if (!ModuleComponent) notFound();

  return (
    <ModuleComponent
      projectPublicId={project.publicId}
      locale={context.locale}
      dir={context.dir}
      siteName={project.name}
      basePath={`/modules/${moduleName}`}
    />
  );
}
