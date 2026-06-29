"use client";

import { useTranslations } from "next-intl";

import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { DashboardSelectField } from "@/components/dashboard/select-field";
import { Separator } from "@/components/ui/separator";
import { locales } from "@/i18n/config";
import {
  dateFormatOptions,
  timeFormatOptions,
  timezoneOptions,
} from "@/lib/site-settings/shared";

import type { ProjectSettingsSectionProps } from "@/lib/projects/project/settings";

function isOneOf<T extends readonly string[]>(
  options: T,
  value: string,
): value is T[number] {
  return (options as readonly string[]).includes(value);
}

type SelectSettingProps = {
  id: string;
  label: string;
  description: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  getLabel?: (value: string) => string;
  className?: string;
};

function SettingsSelectField({
  id,
  label,
  description,
  value,
  options,
  onChange,
  getLabel = (option) => option,
  className = "w-full sm:w-64",
}: SelectSettingProps) {
  return (
    <DashboardSelectField
      id={id}
      label={label}
      description={description}
      value={value}
      options={options}
      onChange={onChange}
      getLabel={getLabel}
      triggerClassName={className}
    />
  );
}

export function GeneralSettingsCard({
  form,
  set,
}: ProjectSettingsSectionProps) {
  const t = useTranslations("settings");

  return (
    <DashboardSectionCard
      title={t("general.title")}
      description={t("general.description")}
      contentClassName="space-y-6"
    >
      <SettingsSelectField
        id="siteLanguage"
        label={t("general.siteLanguage")}
        description={t("general.siteLanguageDescription")}
        value={form.siteLanguage}
        options={locales}
        onChange={(value) => {
          if (isOneOf(locales, value)) {
            set("siteLanguage", value);
          }
        }}
        getLabel={(value) =>
          isOneOf(locales, value) ? t(`seo.locales.${value}`) : value
        }
      />

      <Separator />

      <SettingsSelectField
        id="timezone"
        label={t("general.timezone")}
        description={t("general.timezoneDescription")}
        value={form.timezone}
        options={timezoneOptions}
        onChange={(value) => {
          if (isOneOf(timezoneOptions, value)) {
            set("timezone", value);
          }
        }}
      />

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        <SettingsSelectField
          id="dateFormat"
          label={t("general.dateFormat")}
          description={t("general.dateFormatDescription")}
          value={form.dateFormat}
          options={dateFormatOptions}
          onChange={(value) => {
            if (isOneOf(dateFormatOptions, value)) {
              set("dateFormat", value);
            }
          }}
          getLabel={(value) => t(`general.dateFormats.${value}`)}
          className="w-full"
        />
        <SettingsSelectField
          id="timeFormat"
          label={t("general.timeFormat")}
          description={t("general.timeFormatDescription")}
          value={form.timeFormat}
          options={timeFormatOptions}
          onChange={(value) => {
            if (isOneOf(timeFormatOptions, value)) {
              set("timeFormat", value);
            }
          }}
          getLabel={(value) => t(`general.timeFormats.${value}`)}
          className="w-full"
        />
      </div>
    </DashboardSectionCard>
  );
}
