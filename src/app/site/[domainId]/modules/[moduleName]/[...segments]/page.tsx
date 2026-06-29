import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getProjectModuleServerDefinition } from "@/features/modules/_core/server-registry";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { buildProjectAuthHref } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { isProjectModuleActive } from "@/lib/projects/modules";

type Props = {
  params: Promise<{
    domainId: string;
    moduleName: string;
    segments: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveModuleRoute({ params, searchParams }: Props) {
  const [{ domainId, moduleName, segments }, resolvedSearchParams] =
    await Promise.all([params, searchParams]);
  const definition = getProjectModuleServerDefinition(moduleName);
  const project = await getPublicProject(domainId);
  if (!definition?.routes || !project) return null;

  const [settings, session, active] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    isProjectModuleActive(project.id, moduleName),
  ]);
  if (!session || !active) return null;

  const route = definition.routes.find((candidate) =>
    candidate.matches(segments),
  );
  if (!route) return null;

  const { locale } = await getProjectRequestContext(domainId, settings.general);
  return {
    route,
    context: {
      locale,
      projectPublicId: project.publicId,
      basePath: `/modules/${moduleName}`,
      segments,
      searchParams: resolvedSearchParams,
    },
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const resolved = await resolveModuleRoute(props);
  if (!resolved?.route.metadata) return {};
  return resolved.route.metadata(resolved.context);
}

export default async function ProjectSiteModuleRoutePage(props: Props) {
  const [{ domainId, moduleName, segments }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const project = await getPublicProject(domainId);
  if (!project) redirect("/");

  const [settings, session, active] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
    isProjectModuleActive(project.id, moduleName),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);

  if (!session) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        `/modules/${moduleName}/${segments.join("/")}`,
      ),
    );
  }

  const definition = getProjectModuleServerDefinition(moduleName);
  const route = definition?.routes?.find((candidate) =>
    candidate.matches(segments),
  );
  if (!active || !route) notFound();

  return route.render({
    locale: context.locale,
    projectPublicId: project.publicId,
    basePath: `/modules/${moduleName}`,
    segments,
    searchParams,
  });
}
