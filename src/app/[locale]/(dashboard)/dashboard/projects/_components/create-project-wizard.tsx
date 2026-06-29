"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { DashboardFormField } from "@/components/dashboard/form-field";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/lib/toast-manager";
import {
  createProjectWithConfig,
  type ProjectRecord,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import { CredentialField } from "./credential-field";
import {
  EMPTY_PROJECT_WIZARD_FORM,
  PROJECT_NAME_MAX_LENGTH,
  type ProjectWizardForm,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

type Props = {
  onSuccess: (project: ProjectRecord) => void;
};

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <span>{children}</span>
      <span className="text-destructive">*</span>
    </span>
  );
}

export function CreateProjectWizard({ onSuccess }: Props) {
  const t = useTranslations("projects");
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ProjectWizardForm>(
    EMPTY_PROJECT_WIZARD_FORM,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectWizardForm, string>>
  >({});
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ProjectWizardForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep1() {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = t("form.nameRequired");
    else if (form.name.trim().length > PROJECT_NAME_MAX_LENGTH) {
      next.name = t("form.nameTooLong");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2() {
    const next: typeof errors = {};
    if (!form.databaseUrl.trim())
      next.databaseUrl = t("create.databaseUrlRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validateStep2()) return;

    startTransition(async () => {
      try {
        const project = await createProjectWithConfig({
          name: form.name.trim(),
          databaseUrl: form.databaseUrl.trim(),
          clerkPublishableKey: form.clerkPublishableKey.trim(),
          clerkSecretKey: form.clerkSecretKey.trim(),
        });
        toastManager.add({
          title: t("form.createSuccess"),
          type: "success",
          timeout: 3000,
        });
        onSuccess(project);
      } catch {
        toastManager.add({
          title: t("form.createError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {step === 1 ? t("create.step1Title") : t("create.step2Title")}
        </DialogTitle>
        <DialogDescription>
          {step === 1
            ? t("create.step1Description")
            : t("create.step2Description")}
        </DialogDescription>
      </DialogHeader>

      <div
        className="flex items-center gap-3"
        aria-label={t("create.stepOf", { current: step, total: 2 })}
      >
        <div className="flex items-center gap-1.5">
          <span className="bg-primary size-2 rounded-full" />
          <span
            className={`h-px w-8 transition-colors ${step === 2 ? "bg-primary" : "bg-border"}`}
          />
          <span
            className={`size-2 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-border"}`}
          />
        </div>
        <span className="text-muted-foreground text-xs">
          {t("create.stepOf", { current: step, total: 2 })}
        </span>
      </div>

      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (validateStep1()) setStep(2);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <DashboardFormField id="name" label={t("form.name")}>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("form.namePlaceholder")}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                aria-invalid={!!errors.name}
                autoFocus
              />
              {errors.name ? (
                <p className="text-destructive text-xs">{errors.name}</p>
              ) : null}
            </DashboardFormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{t("create.next")}</Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <DashboardFormField
              id="databaseUrl"
              label={<RequiredLabel>DATABASE_URL</RequiredLabel>}
              description={t("authConfig.databaseUrlDescription")}
            >
              <CredentialField
                id="databaseUrl"
                value={form.databaseUrl}
                onChange={(v) => set("databaseUrl", v)}
                placeholder="postgresql://..."
                copyLabel={t("authConfig.copy")}
                copiedLabel={t("authConfig.copied")}
                showLabel={t("authConfig.showSecret")}
                hideLabel={t("authConfig.hideSecret")}
                required
                showCopy={false}
                autoFocus
                error={errors.databaseUrl}
              />
            </DashboardFormField>

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
                secret={false}
                copyLabel={t("authConfig.copy")}
                copiedLabel={t("authConfig.copied")}
                showCopy={false}
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
                showCopy={false}
                error={errors.clerkSecretKey}
              />
            </DashboardFormField>

            <p className="text-xs text-muted-foreground rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
              {t("create.clerkNote")}
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isPending}
            >
              {t("create.back")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("form.creating")}
                </>
              ) : (
                t("create.create")
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
