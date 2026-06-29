"use client";

import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import { DashboardFormField } from "@/components/dashboard/form-field";
import {
  getIdentityInitials,
  IdentityPreviewCard,
  IdentityStatusRow,
} from "@/components/dashboard/identity-preview-card";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { toastManager } from "@/lib/toast-manager";
import { roles, type Role } from "@/lib/users/role-values";

import {
  updateUser,
  type UserEditorRecord,
} from "@/app/[locale]/(dashboard)/dashboard/users/_actions/user-actions";

type Props = {
  user: UserEditorRecord;
};

export function UserEditView({ user }: Props) {
  const t = useTranslations("users");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
  });
  const isGoogleManaged = user.hasGoogleAccount;
  const hasChanges =
    form.name !== (user.name ?? "") ||
    form.email !== (user.email ?? "") ||
    form.role !== user.role;
  const displayName = form.name || form.email || user.id;

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await updateUser(user.id, form);
        toastManager.add({
          title: t("saved"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: t("error"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardPageHeader
        title={t("editTitle", { name: user.name ?? user.email ?? user.id })}
        description={t("editDescription")}
        actions={
          <Button type="submit" disabled={isPending || !hasChanges}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("save")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DashboardSectionCard
          title={t("editFields")}
          description={t("editFieldsDescription")}
          contentClassName="grid gap-4"
        >
          <DashboardFormField id="userName" label={t("name")}>
            <Input
              id="userName"
              value={form.name}
              autoComplete="name"
              maxLength={120}
              onChange={(event) => setField("name", event.target.value)}
            />
          </DashboardFormField>

          <DashboardFormField id="userEmail" label={t("email")}>
            <Input
              id="userEmail"
              type="email"
              value={form.email}
              autoComplete="email"
              dir="ltr"
              disabled={isGoogleManaged}
              onChange={(event) => setField("email", event.target.value)}
            />
            {isGoogleManaged ? (
              <p className="text-muted-foreground text-xs">
                {t("googleManagedField")}
              </p>
            ) : null}
          </DashboardFormField>

          <DashboardFormField id="userRole" label={t("role")}>
            <Select
              value={form.role}
              onValueChange={(nextValue) => setField("role", nextValue as Role)}
            >
              <SelectTrigger id="userRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DashboardFormField>
        </DashboardSectionCard>

        <IdentityPreviewCard
          title={t("previewTitle")}
          description={t("previewDescription")}
          name={displayName}
          email={form.email}
          image={user.image ?? undefined}
          fallback={getIdentityInitials(form.name || null, form.email || null)}
        >
          <IdentityStatusRow label={t("statusLabel")}>
            <StatusBadge variant={user.emailVerified ? "success" : "warning"}>
              {user.emailVerified
                ? t("status.verified")
                : t("status.unverified")}
            </StatusBadge>
          </IdentityStatusRow>
          <IdentityStatusRow label={t("googleLabel")}>
            <StatusBadge variant={isGoogleManaged ? "default" : "outline"}>
              {isGoogleManaged ? t("googleManaged") : t("manualManaged")}
            </StatusBadge>
          </IdentityStatusRow>
        </IdentityPreviewCard>
      </div>
    </form>
  );
}
