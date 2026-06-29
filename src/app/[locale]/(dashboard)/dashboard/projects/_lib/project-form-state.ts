import type { ProjectStatus } from "@prisma/client";

import type { ProjectConfig } from "@/lib/projects/project/_config";

export const PROJECT_NAME_MAX_LENGTH = 100;

export type ProjectNameForm = {
  name: string;
};

export type ProjectConfigForm = {
  clerkPublishableKey: string;
  clerkSecretKey: string;
  databaseUrl: string;
};

export type ProjectWizardForm = ProjectNameForm & ProjectConfigForm;

export const EMPTY_PROJECT_WIZARD_FORM: ProjectWizardForm = {
  name: "",
  databaseUrl: "",
  clerkPublishableKey: "",
  clerkSecretKey: "",
};

export function toProjectNameForm(project: ProjectNameForm): ProjectNameForm {
  return { name: project.name };
}

export function toProjectConfigForm(config: ProjectConfig): ProjectConfigForm {
  return {
    clerkPublishableKey: config.clerkPublishableKey ?? "",
    clerkSecretKey: config.clerkSecretKey ?? "",
    databaseUrl: config.databaseUrl ?? "",
  };
}

export function getProjectStatusVariant(status: ProjectStatus) {
  if (status === "active") return "success";
  if (status === "suspended") return "destructive";
  if (status === "draft" || status === "deleting") return "warning";
  return "secondary";
}
