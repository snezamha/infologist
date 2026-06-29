"use client";

import { useTranslations } from "next-intl";

import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Separator } from "@/components/ui/separator";

import { AppearancePreview } from "./appearance-preview";
import { ColorSchemePicker } from "./color-scheme-picker";
import { LoadingSettings } from "./loading-settings";
import { RadiusPicker } from "./radius-picker";
import type { SettingsSectionProps } from "@/components/shared/settings-form";

export function AppearanceSettingsCard({ form, set }: SettingsSectionProps) {
  const t = useTranslations("settings");

  return (
    <DashboardSectionCard
      title={t("appearance.title")}
      description={t("appearance.description")}
      contentClassName="space-y-8"
    >
      <ColorSchemePicker form={form} set={set} />
      <Separator />
      <RadiusPicker form={form} set={set} />
      <Separator />
      <LoadingSettings form={form} set={set} />
      <Separator />
      <AppearancePreview form={form} />
    </DashboardSectionCard>
  );
}
