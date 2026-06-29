import { apiListPromptTemplates } from "@/features/ai-assistant/actions/prompt-templates";
import { getTranslations } from "next-intl/server";

import PromptTemplatesClient from "./prompt-templates-client";

export async function getPromptTemplatesMetadata(locale: string) {
  const t = await getTranslations({
    locale,
    namespace: "ai-assistant",
  });
  return { title: t("promptTemplates.title") };
}

export default async function PromptTemplatesPage({
  canManageProtectedTemplates,
  projectPublicId,
}: {
  canManageProtectedTemplates: boolean;
  projectPublicId: string;
}) {
  const templates = await apiListPromptTemplates(projectPublicId);
  return (
    <PromptTemplatesClient
      initialTemplates={templates}
      canManageProtectedTemplates={canManageProtectedTemplates}
      projectPublicId={projectPublicId}
    />
  );
}
