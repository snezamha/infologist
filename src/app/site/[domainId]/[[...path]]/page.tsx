import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import deProjects from "@/messages/de/projects.json";
import enProjects from "@/messages/en/projects.json";
import faProjects from "@/messages/fa/projects.json";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectSiteName } from "@/lib/projects/project/site";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { parseSeoSettings } from "@/lib/site-settings/seo";

const publicPageMessages = {
  de: deProjects.publicPage,
  en: enProjects.publicPage,
  fa: faProjects.publicPage,
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    projectId: string;
  }
>;

type Props = {
  params: Promise<{ domainId: string; path?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domainId, path } = await params;
  const project = await getPublicProject(domainId);

  if (!project || (path?.length ?? 0) > 0) return {};

  const settings = await getPublicProjectSettings(project.id);
  const { locale } = await getProjectRequestContext(domainId, settings.general);
  const siteName = getProjectSiteName(settings.general, project.name);
  const seo = parseSeoSettings(settings.seo)[locale];

  const title = seo.title
    ? `${seo.title}${seo.separator}${siteName}`
    : siteName;

  return {
    title,
    description: seo.description || undefined,
  };
}

export default async function PublicProjectPage({ params }: Props) {
  const { domainId, path } = await params;
  const project = await getPublicProject(domainId);

  if (!project) notFound();
  if ((path?.length ?? 0) > 0) notFound();

  const settings = await getPublicProjectSettings(project.id);
  const { dir, locale } = await getProjectRequestContext(
    domainId,
    settings.general,
  );
  const siteName = getProjectSiteName(settings.general, project.name);
  const copy = publicPageMessages[locale];
  const title = copy.title.replace("{name}", siteName);

  return (
    <main
      dir={dir}
      className="from-background via-background to-primary/10 relative grid min-h-dvh place-items-center overflow-hidden bg-linear-to-b p-6"
    >
      <div className="bg-primary/15 absolute inset-x-0 top-0 h-56 blur-3xl" />
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-5">
        <Card className="bg-background/85 w-full max-w-2xl border shadow-xl backdrop-blur">
          <CardContent className="space-y-8 px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className="space-y-4">
              <span className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-xs font-medium">
                {copy.eyebrow}
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="text-muted-foreground mx-auto max-w-xl text-sm leading-7 sm:text-base">
                  {copy.description}
                </p>
              </div>
            </div>

            <div className="bg-muted/60 flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-4">
              <p className="text-muted-foreground text-xs font-medium">
                {copy.projectId}
              </p>
              <p className="font-mono text-sm" dir="ltr">
                {project.publicId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
