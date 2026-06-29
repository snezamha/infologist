import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { getRequestLocale } from "@/i18n/locale";
import { requirePermission } from "@/lib/auth/rbac";
import { isActionError } from "@/lib/errors/action-error";
import { getProjectFeatureSettingsSnapshot } from "@/features/_core/lib";
import { listProjectModulesForProject } from "@/lib/projects/modules";
import { getProjectByPublicId } from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import { AdminProjectFeaturesView } from "@/features/_core/_components/admin-features-view";
import { getProjectUrl } from "@/lib/projects/project/domain";
import { createProjectAdminHandoffToken } from "@/lib/projects/project/admin-handoff";

type Props = {
  params: Promise<{ publicId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "projects" });
  return { title: `${t("featuresPage.title")} - ${publicId}` };
}

export default async function AdminProjectFeaturesPage({ params }: Props) {
  const { publicId } = await params;
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await requirePermission("projects.manage");

  const project = await getProjectByPublicId(publicId).catch((error) => {
    if (isActionError(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  if (!project) {
    notFound();
  }

  const [features, modules] = await Promise.all([
    getProjectFeatureSettingsSnapshot(project.id),
    listProjectModulesForProject(project.id),
  ]);

  const t = await getTranslations({ locale, namespace: "projects" });
  const projectSiteUrl = getProjectUrl(publicId);
  const handoffToken = createProjectAdminHandoffToken(
    project.id,
    session.user.id,
  );
  const projectHandoffUrl = handoffToken
    ? `${new URL("auth/handoff", projectSiteUrl).toString()}?${new URLSearchParams({ token: handoffToken }).toString()}`
    : undefined;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("title"), href: "/dashboard/projects" },
          { label: project.name, href: `/dashboard/projects/${publicId}` },
          { label: t("featuresPage.title") },
        ]}
      />
      <DashboardPageHeader
        title={t("featuresPage.title")}
        description={t("featuresPage.description", { name: project.name })}
      />
      <AdminProjectFeaturesView
        projectId={project.id}
        projectPublicId={project.publicId}
        projectSiteUrl={projectSiteUrl}
        projectHandoffUrl={projectHandoffUrl}
        canManageProtectedSettings={session.user.role === "super_admin"}
        canDeleteModules={
          session.user.role === "super_admin" &&
          (process.env.NODE_ENV !== "production" ||
            Boolean(process.env.MODULE_DEPLOYMENTS_DIR))
        }
        initialFeatures={features}
        initialModules={modules}
      />
    </div>
  );
}
