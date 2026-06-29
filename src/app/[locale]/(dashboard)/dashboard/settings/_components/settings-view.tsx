"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { type AppearanceSettings } from "@/lib/settings";
import { toastManager } from "@/lib/toast-manager";

import { AppearanceSettingsCard } from "@/components/shared/appearance-settings-card";
import { saveAppearanceSettings } from "@/app/[locale]/(dashboard)/dashboard/settings/_actions/settings-actions";

type Props = {
  settings: AppearanceSettings;
};

export function SettingsView({ settings }: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...settings });

  function set<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const payload = Object.fromEntries(
          Object.entries(form).filter(([key]) => key !== "id"),
        ) as Partial<Omit<AppearanceSettings, "id">>;
        await saveAppearanceSettings(payload);
        router.refresh();
        toastManager.add({ title: t("saved"), type: "success", timeout: 3000 });
      } catch {
        toastManager.add({ title: t("error"), type: "error", timeout: 5000 });
      }
    });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("save")}
          </Button>
        }
      />

      <AppearanceSettingsCard form={form} set={set} />
    </div>
  );
}
