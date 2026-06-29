import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requirePermission } from "@/lib/auth/rbac";
import { hasPermission } from "@/lib/auth/permissions";
import { getRequestLocale } from "@/i18n/locale";
import type { Role } from "@/lib/users/role";

import { getProjects } from "./_actions/project-actions";
import { ProjectsView } from "./_components/projects-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "projects" });
  return { title: t("title") };
}

export default async function ProjectsPage() {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await requirePermission("projects.read");
  const projects = await getProjects();
  const canManage = hasPermission(session.user.role as Role, "projects.manage");

  return <ProjectsView projects={projects} canManage={canManage} />;
}
