"use client";

import { useTranslations } from "next-intl";

import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDirection, localeLabels, type Locale } from "@/i18n/config";
import type {
  ProjectSettings,
  ProjectSettingsSectionProps,
} from "@/lib/projects/project/settings";
import { LocaleTabs } from "@/components/shared/locale-tabs";

type SeoPrefix = "seoTitle" | "seoDescription" | "seoSeparator";

function getLocaleKey(prefix: SeoPrefix, locale: Locale) {
  return `${prefix}${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof ProjectSettings;
}

function LocaleSeoFields({
  locale,
  form,
  set,
}: ProjectSettingsSectionProps & { locale: Locale }) {
  const t = useTranslations("settings");
  const titleKey = getLocaleKey("seoTitle", locale);
  const descKey = getLocaleKey("seoDescription", locale);
  const sepKey = getLocaleKey("seoSeparator", locale);
  const dir = getDirection(locale);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <DashboardFormField id={`title-${locale}`} label={t("seo.siteTitle")}>
          <Input
            id={`title-${locale}`}
            dir={dir}
            value={String(form[titleKey] ?? "")}
            placeholder={t("seo.siteTitlePlaceholder")}
            onChange={(event) => set(titleKey, event.target.value as never)}
          />
        </DashboardFormField>
        <DashboardFormField id={`sep-${locale}`} label={t("seo.separator")}>
          <Input
            id={`sep-${locale}`}
            dir="ltr"
            value={String(form[sepKey] ?? "")}
            placeholder={t("seo.separatorPlaceholder")}
            onChange={(event) => set(sepKey, event.target.value as never)}
            className="w-24"
          />
        </DashboardFormField>
      </div>
      <DashboardFormField
        id={`desc-${locale}`}
        label={t("seo.metaDescription")}
      >
        <Textarea
          id={`desc-${locale}`}
          dir={dir}
          value={String(form[descKey] ?? "")}
          placeholder={t("seo.metaDescriptionPlaceholder")}
          onChange={(event) => set(descKey, event.target.value as never)}
          rows={3}
        />
      </DashboardFormField>
      <div className="bg-muted rounded-lg px-3 py-2 font-mono text-xs">
        <span className="text-muted-foreground">{t("seo.preview")}: </span>
        {String(form[titleKey] ?? "")}
        {String(form[sepKey] ?? "")}
        {localeLabels[locale]}
      </div>
    </div>
  );
}

export function SeoSettingsCard({ form, set }: ProjectSettingsSectionProps) {
  const t = useTranslations("settings");

  return (
    <DashboardSectionCard
      title={t("seo.title")}
      description={t("seo.description")}
    >
      <LocaleTabs
        namespace="settings"
        labelKey="seo.locales"
        contentClassName="space-y-4 pt-4"
      >
        {(locale) => <LocaleSeoFields locale={locale} form={form} set={set} />}
      </LocaleTabs>
    </DashboardSectionCard>
  );
}
