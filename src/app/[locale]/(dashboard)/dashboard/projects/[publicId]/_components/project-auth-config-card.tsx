"use client";

import { useTranslations } from "next-intl";

import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { CredentialField } from "@/app/[locale]/(dashboard)/dashboard/projects/_components/credential-field";
import type { ProjectConfigForm } from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

type Props = {
  form: ProjectConfigForm;
  errors: Partial<Record<keyof ProjectConfigForm, string>>;
  set: <K extends keyof ProjectConfigForm>(key: K, value: string) => void;
};

export function ProjectAuthConfigCard({ form, errors, set }: Props) {
  const t = useTranslations("projects");

  return (
    <div className="space-y-4">
      <DashboardSectionCard
        title={t("authConfig.clerkTitle")}
        description={t("authConfig.clerkDescription")}
        contentClassName="space-y-4"
      >
        <DashboardFormField
          id="clerkPublishableKey"
          label="CLERK_PUBLISHABLE_KEY"
          description={t("authConfig.clerkPublishableKeyDescription")}
        >
          <CredentialField
            id="clerkPublishableKey"
            value={form.clerkPublishableKey}
            onChange={(v) => set("clerkPublishableKey", v)}
            placeholder="pk_test_..."
            copyLabel={t("authConfig.copy")}
            copiedLabel={t("authConfig.copied")}
            secret={false}
            error={errors.clerkPublishableKey}
          />
        </DashboardFormField>

        <DashboardFormField
          id="clerkSecretKey"
          label="CLERK_SECRET_KEY"
          description={t("authConfig.clerkSecretKeyDescription")}
        >
          <CredentialField
            id="clerkSecretKey"
            value={form.clerkSecretKey}
            onChange={(v) => set("clerkSecretKey", v)}
            placeholder="sk_test_..."
            copyLabel={t("authConfig.copy")}
            copiedLabel={t("authConfig.copied")}
            showLabel={t("authConfig.showSecret")}
            hideLabel={t("authConfig.hideSecret")}
            error={errors.clerkSecretKey}
          />
        </DashboardFormField>
      </DashboardSectionCard>

      <DashboardSectionCard
        title={t("authConfig.databaseTitle")}
        description={t("authConfig.databaseDescription")}
        contentClassName="space-y-4"
      >
        <DashboardFormField
          id="databaseUrl"
          label="DATABASE_URL"
          description={t("authConfig.databaseUrlDescription")}
        >
          <CredentialField
            id="databaseUrl"
            value={form.databaseUrl}
            placeholder="postgresql://..."
            onChange={(v) => set("databaseUrl", v)}
            copyLabel={t("authConfig.copy")}
            copiedLabel={t("authConfig.copied")}
            showLabel={t("authConfig.showSecret")}
            hideLabel={t("authConfig.hideSecret")}
          />
        </DashboardFormField>
      </DashboardSectionCard>
    </div>
  );
}
