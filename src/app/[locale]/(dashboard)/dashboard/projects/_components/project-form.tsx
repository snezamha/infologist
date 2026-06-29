"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";

import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/lib/toast-manager";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import {
  updateProject,
  type ProjectRecord,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import {
  PROJECT_NAME_MAX_LENGTH,
  toProjectNameForm,
  type ProjectNameForm,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

type Props = {
  project: ProjectRecord;
  onSuccess?: (project: ProjectRecord) => void;
};

type FieldErrors = Partial<Record<keyof ProjectNameForm, string>>;

export function ProjectForm({ project, onSuccess }: Props) {
  const t = useTranslations("projects");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectNameForm>(() =>
    toProjectNameForm(project),
  );
  const [savedForm, setSavedForm] = useState<ProjectNameForm>(() =>
    toProjectNameForm(project),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const isDirty = form.name !== savedForm.name;

  useUnsavedChangesWarning(isDirty, t("unsaved.confirmLeave"));

  function validate() {
    const nextErrors: FieldErrors = {};
    const name = form.name.trim();

    if (!name) nextErrors.name = t("form.nameRequired");
    if (name.length > PROJECT_NAME_MAX_LENGTH) {
      nextErrors.name = t("form.nameTooLong");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    return { name };
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validated = validate();
    if (!validated) return;

    startTransition(async () => {
      try {
        const result = await updateProject(project.id, validated);
        toastManager.add({
          title: t("form.saveSuccess"),
          type: "success",
          timeout: 3000,
        });
        const nextForm = toProjectNameForm(result);
        setForm(nextForm);
        setSavedForm(nextForm);
        onSuccess?.(result);
      } catch {
        toastManager.add({
          title: t("form.saveError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardSectionCard
        title={t("editTitle")}
        description={t("editDescription")}
        contentClassName="space-y-4"
      >
        <DashboardFormField id="name" label={t("form.name")}>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => {
              setForm({ name: e.target.value });
              setErrors({});
            }}
            placeholder={t("form.namePlaceholder")}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            required
          />
          {errors.name ? (
            <p
              id="name-error"
              className="text-destructive text-xs"
              aria-live="polite"
            >
              {errors.name}
            </p>
          ) : null}
        </DashboardFormField>
      </DashboardSectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("form.saving")}
            </>
          ) : (
            <>
              <Save className="me-2 h-4 w-4" />
              {t("form.save")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
