"use client";

import { useTranslations } from "next-intl";
import type { ProjectStatus } from "@prisma/client";

import { StatusBadge } from "@/components/ui/status-badge";
import { getProjectStatusVariant } from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

type Props = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: Props) {
  const t = useTranslations("projects");

  return (
    <StatusBadge variant={getProjectStatusVariant(status)}>
      {t(`status.${status}`)}
    </StatusBadge>
  );
}
