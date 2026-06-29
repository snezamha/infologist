import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  default as PromptTemplatesPage,
  getPromptTemplatesMetadata,
} from "@/features/ai-assistant/_components/pages/prompt-templates-page";
import { getProjectFeatureSettingsSnapshot } from "@/features/_core/lib";
import { getRequestLocale } from "@/i18n/locale";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { buildProjectAuthHref } from "@/lib/projects/project/site";
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
  return getPromptTemplatesMetadata(locale);
}

export default async function SiteProjectAiPromptTemplatesPage({
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
        "/dashboard/ai-assistant/prompt-templates",
      ),
    );
  }

  const features = await getProjectFeatureSettingsSnapshot(project.id);
  if (!features.aiAssistant.enabled) {
    notFound();
  }

  return (
    <PromptTemplatesPage
      canManageProtectedTemplates={user.role === "admin"}
      projectPublicId={project.publicId}
    />
  );
}
