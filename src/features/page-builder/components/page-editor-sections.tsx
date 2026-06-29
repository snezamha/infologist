"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { LocalizedTranslateField } from "@/components/dashboard/localized-translate-field";
import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { DashboardSelectField } from "@/components/dashboard/select-field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LocaleTabs } from "@/components/shared/locale-tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultLocale,
  getDirection,
  locales,
  type Locale,
} from "@/i18n/config";
import {
  getTranslationWarnings,
  hasTranslationWarnings,
} from "@/features/page-builder/translation-status";
import type { PageFormData } from "@/features/page-builder/types";
import { sanitizeMediaUrl } from "@/features/page-builder/puck/safety";
import { AlignedBadge } from "@/components/ui/aligned-badge";

import {
  pageStatuses,
  isPageStatus,
  type PageEditorMode,
  type PageFieldSetter,
  type PageTranslationFieldSetter,
} from "@/features/page-builder/page-editor-model";
import { SlugField } from "@/features/page-builder/components/slug-field";

type EditorSectionProps = {
  form: PageFormData;
  setField: PageFieldSetter;
};

type LocaleContentProps = EditorSectionProps & {
  setTranslationField: PageTranslationFieldSetter;
  onSlugTouched: (locale: Locale) => void;
};

type PageDetailsProps = EditorSectionProps & {
  mode: PageEditorMode;
  homepagePageId?: string | null;
  currentPageId?: string;
};

type WarningProps = {
  form: PageFormData;
};

type PublishingToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function TranslationWarningPanel({ form }: WarningProps) {
  const t = useTranslations("pageBuilder");
  const translationWarnings = getTranslationWarnings(form);

  if (!hasTranslationWarnings(form)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-50">
      <p className="font-medium">{t("form.translationWarningTitle")}</p>
      <ul className="mt-2 list-disc space-y-1 ps-5">
        {translationWarnings
          .filter((warning) => warning.missingTitle || warning.missingBody)
          .map((warning) => (
            <li key={warning.locale}>
              {t("form.translationWarningItem", {
                locale: t(`locales.${warning.locale}`),
                fields: [
                  warning.missingTitle ? t("form.title") : null,
                  warning.missingBody ? t("form.pageContent") : null,
                ]
                  .filter(Boolean)
                  .join(", "),
              })}
            </li>
          ))}
      </ul>
    </div>
  );
}

export function PageDetailsCard({
  form,
  setField,
  mode,
  homepagePageId,
  currentPageId,
}: PageDetailsProps) {
  const t = useTranslations("pageBuilder");

  const isAnotherPageHomepage =
    homepagePageId && homepagePageId !== currentPageId;
  const isHomepageDisabled = !form.isHomepage && !!isAnotherPageHomepage;

  return (
    <Accordion
      type="single"
      defaultValue={mode === "edit" ? "publishing" : undefined}
    >
      <AccordionItem value="publishing">
        <AccordionTrigger>
          <span className="space-y-1">
            <span className="block">{t("form.publishingSettings")}</span>
            <span className="text-muted-foreground block text-xs font-normal">
              {t("form.publishingSettingsDescription")}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-4">
            <DashboardSelectField
              id="status"
              label={t("form.status")}
              className="lg:col-span-2"
              value={form.status}
              options={pageStatuses}
              onChange={(value) => {
                if (isPageStatus(value)) {
                  setField("status", value);
                }
              }}
              getLabel={(value) => t(`status.${value}`)}
              triggerClassName="w-full"
            />
          </div>
          <div className="grid gap-3">
            <PublishingToggleField
              id="noIndex"
              label={t("form.noIndex")}
              description={t("form.noIndexDescription")}
              checked={form.noIndex}
              onCheckedChange={(checked) => setField("noIndex", checked)}
            />
            <PublishingToggleField
              id="isHomepage"
              label={t("form.homepage")}
              description={
                isHomepageDisabled
                  ? t("form.homepageAlreadySet")
                  : t("form.homepageDescription")
              }
              checked={form.isHomepage}
              onCheckedChange={(checked) => setField("isHomepage", checked)}
              disabled={isHomepageDisabled}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function PublishingToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: PublishingToggleProps) {
  return (
    <div
      className={`bg-background flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${disabled ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="block text-sm leading-5">
          {label}
        </Label>
        {description ? (
          <p className="text-muted-foreground text-xs leading-5">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || false}
      />
    </div>
  );
}

export function LocaleTabsCard({ form }: Pick<LocaleContentProps, "form">) {
  const t = useTranslations("pageBuilder");

  return (
    <DashboardSectionCard title={t("form.languageStatus")}>
      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => {
          const translation = form.translations[locale];
          const complete =
            translation.enabled &&
            Boolean(translation.title.trim()) &&
            Boolean(translation.builderData?.content.length);
          return (
            <div
              key={locale}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                complete
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {t(`locales.${locale}`)}
              <span
                className={`size-1.5 rounded-full ${
                  complete ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </div>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}

export function LocalePageCard({
  form,
  setField,
  setTranslationField,
  onSlugTouched,
}: LocaleContentProps) {
  const t = useTranslations("pageBuilder");
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);

  return (
    <DashboardSectionCard
      title={t("form.localizedContent")}
      description={t("form.localizedContentDescription")}
    >
      <LocaleTabs
        value={activeLocale}
        onValueChange={setActiveLocale}
        contentClassName="space-y-4 pt-4"
      >
        {(locale) => {
          const translation = form.translations[locale];
          const dir = getDirection(locale);
          const localeLabel = t(`locales.${locale}`);
          const fieldLabel = (key: string) => `${t(key)} (${localeLabel})`;
          const slugValue =
            locale === "en"
              ? form.slugEn
              : locale === "fa"
                ? form.slugFa
                : form.slugDe;
          const ogPreviewImage = sanitizeMediaUrl(translation.ogImage);

          return (
            <>
              <PublishingToggleField
                id={`${locale}-enabled`}
                label={fieldLabel("form.localeEnabled")}
                description={t("form.localeEnabledDescription")}
                checked={translation.enabled}
                onCheckedChange={(checked) =>
                  setTranslationField(locale, "enabled", checked)
                }
              />
              <DashboardFormField
                id={`${locale}-title`}
                label={fieldLabel("form.title")}
              >
                <LocalizedTranslateField
                  sourceLocale={locale}
                  sourceValue={translation.title}
                  targetLocales={locales.filter(
                    (targetLocale) =>
                      targetLocale !== locale &&
                      !form.translations[targetLocale].title.trim(),
                  )}
                  onApply={(translations) => {
                    for (const [targetLocale, text] of Object.entries(
                      translations,
                    )) {
                      if (text) {
                        setTranslationField(
                          targetLocale as Locale,
                          "title",
                          text,
                        );
                      }
                    }
                  }}
                >
                  <Input
                    id={`${locale}-title`}
                    value={translation.title}
                    onChange={(event) =>
                      setTranslationField(locale, "title", event.target.value)
                    }
                    required={locale === defaultLocale}
                    dir={dir}
                  />
                </LocalizedTranslateField>
              </DashboardFormField>
              <DashboardFormField
                id={`${locale}-slug`}
                label={fieldLabel("form.slug")}
                description={t("form.slugHint")}
              >
                <SlugField
                  id={`${locale}-slug`}
                  value={slugValue}
                  locale={locale}
                  onChange={(sanitized) => {
                    onSlugTouched(locale);
                    if (locale === "en") setField("slugEn", sanitized);
                    else if (locale === "fa") setField("slugFa", sanitized);
                    else setField("slugDe", sanitized);
                  }}
                  required={locale === defaultLocale}
                  dir="ltr"
                />
              </DashboardFormField>
              <Accordion type="single">
                <AccordionItem value="additional">
                  <AccordionTrigger>
                    <span className="space-y-1">
                      <span className="block">
                        {t("form.additionalSettings")}
                      </span>
                      <span className="text-muted-foreground block text-xs font-normal">
                        {t("form.additionalSettingsDescription")}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <DashboardFormField
                      id={`${locale}-excerpt`}
                      label={fieldLabel("form.excerpt")}
                    >
                      <Textarea
                        id={`${locale}-excerpt`}
                        value={translation.excerpt}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "excerpt",
                            event.target.value,
                          )
                        }
                        rows={3}
                        dir={dir}
                      />
                    </DashboardFormField>
                    <DashboardFormField
                      id={`${locale}-navigation-title`}
                      label={fieldLabel("form.navigationTitle")}
                      description={t("form.navigationTitleHint")}
                    >
                      <Input
                        id={`${locale}-navigation-title`}
                        value={translation.navigationTitle}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "navigationTitle",
                            event.target.value,
                          )
                        }
                        maxLength={100}
                        dir={dir}
                      />
                    </DashboardFormField>
                    <DashboardFormField
                      id={`${locale}-seo-title`}
                      label={fieldLabel("form.seoTitle")}
                      description={t("form.seoTitleHint")}
                    >
                      <Input
                        id={`${locale}-seo-title`}
                        value={translation.seoTitle}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "seoTitle",
                            event.target.value,
                          )
                        }
                        maxLength={200}
                        dir={dir}
                      />
                    </DashboardFormField>
                    <DashboardFormField
                      id={`${locale}-og-image`}
                      label={fieldLabel("form.ogImage")}
                      description={t("form.ogImageHint")}
                    >
                      <Input
                        id={`${locale}-og-image`}
                        type="url"
                        value={translation.ogImage}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "ogImage",
                            event.target.value,
                          )
                        }
                        dir="ltr"
                      />
                    </DashboardFormField>
                    <DashboardFormField
                      id={`${locale}-canonical-url`}
                      label={fieldLabel("form.canonicalUrl")}
                      description={t("form.canonicalUrlHint")}
                    >
                      <Input
                        id={`${locale}-canonical-url`}
                        type="url"
                        value={translation.canonicalUrl}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "canonicalUrl",
                            event.target.value,
                          )
                        }
                        dir="ltr"
                      />
                    </DashboardFormField>
                    <div className="bg-muted/40 space-y-2 rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <AlignedBadge variant="outline">
                          {t("form.searchPreview")}
                        </AlignedBadge>
                      </div>
                      <p className="text-primary text-base font-medium">
                        {translation.seoTitle ||
                          translation.title ||
                          t("form.untitled")}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {translation.seoDescription ||
                          translation.excerpt ||
                          t("form.noDescription")}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                      {ogPreviewImage ? (
                        <div className="bg-muted aspect-[1.91/1] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ogPreviewImage}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-1 p-4">
                        <AlignedBadge variant="outline">
                          {t("form.socialPreview")}
                        </AlignedBadge>
                        <p className="text-foreground font-medium">
                          {translation.seoTitle ||
                            translation.title ||
                            t("form.untitled")}
                        </p>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {translation.seoDescription ||
                            translation.excerpt ||
                            t("form.noDescription")}
                        </p>
                      </div>
                    </div>
                    <DashboardFormField
                      id={`${locale}-seo-description`}
                      label={fieldLabel("form.metaDescription")}
                      description={t("form.seoDescriptionHint")}
                    >
                      <Textarea
                        id={`${locale}-seo-description`}
                        value={translation.seoDescription}
                        onChange={(event) =>
                          setTranslationField(
                            locale,
                            "seoDescription",
                            event.target.value,
                          )
                        }
                        rows={3}
                        maxLength={500}
                        dir={dir}
                      />
                    </DashboardFormField>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          );
        }}
      </LocaleTabs>
    </DashboardSectionCard>
  );
}
