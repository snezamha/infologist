import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/rbac";
import { getRequestLocale } from "@/i18n/locale";
import { isActionError } from "@/lib/errors/action-error";
import { getProjectConfig } from "@/lib/projects/project/_config";

import { getProjectByPublicId } from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import { ProjectDetailView } from "./_components/project-detail-view";

type Props = {
  params: Promise<{ publicId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "projects" });
  return { title: `${t("editTitle")} – ${publicId}` };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { publicId } = await params;
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  await requirePermission("projects.manage");

  const project = await getProjectByPublicId(publicId).catch((error) => {
    if (isActionError(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  if (!project) {
    notFound();
  }

  const configPresence = await getProjectConfig(project.id);

  return <ProjectDetailView project={project} config={configPresence} />;
}
