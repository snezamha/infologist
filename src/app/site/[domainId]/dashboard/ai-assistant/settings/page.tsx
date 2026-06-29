import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AiAssistantSettings from "@/features/ai-assistant/_components/module-settings";
import { getProjectFeatureSettingsSnapshot } from "@/features/_core/lib";
import { getRequestLocale } from "@/i18n/locale";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ai-assistant" });
  return { title: t("management.title") };
}

export default async function SiteProjectAiAssistantSettingsPage({
  params,
}: Props) {
  const { domainId } = await params;
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const project = await getPublicProject(domainId);

  if (!project) {
    notFound();
  }

  const [settings, user] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectSession(project.id, domainId),
  ]);
  const context = await getProjectRequestContext(domainId, settings.general);

  if (!user) {
    redirect(
      buildProjectAuthHref(
        domainId,
        context.visiblePathname,
        "/dashboard/ai-assistant/settings",
      ),
    );
  }

  if (user.role !== "admin") {
    redirect(buildProjectHref(domainId, context.visiblePathname, "/dashboard"));
  }

  const features = await getProjectFeatureSettingsSnapshot(project.id);
  if (!features.aiAssistant.enabled) {
    notFound();
  }

  return (
    <AiAssistantSettings
      key={project.publicId}
      projectPublicId={project.publicId}
    />
  );
}
