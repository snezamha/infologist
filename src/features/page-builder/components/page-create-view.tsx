"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildProjectHref } from "@/lib/projects/project/site";
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { sanitizeSlug } from "@/features/page-builder/slug";
import { createPageQuick } from "@/features/page-builder/actions";
import type { PageCreateFormData } from "@/features/page-builder/types";
import { getActionErrorMessage } from "@/lib/errors/action-error";
import { toastManager } from "@/lib/toast-manager";
import { LocaleTabs } from "@/components/shared/locale-tabs";
import { SlugField } from "@/features/page-builder/components/slug-field";

type Props = {
  domainId: string;
};

type FormData = {
  en: { title: string; slug: string };
  fa: { title: string; slug: string };
  de: { title: string; slug: string };
  status: "draft" | "published";
};

export function PageCreateView({ domainId }: Props) {
  const t = useTranslations("pageBuilder");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);
  const [form, setForm] = useState<FormData>({
    en: { title: "", slug: "" },
    fa: { title: "", slug: "" },
    de: { title: "", slug: "" },
    status: "draft",
  });

  function handleTitleChange(locale: Locale, value: string) {
    setForm((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        title: value,
        slug: sanitizeSlug(value, locale),
      },
    }));
  }

  function handleSlugChange(locale: Locale, value: string) {
    setForm((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], slug: value },
    }));
  }

  const isEnglishComplete = Boolean(
    form.en.title.trim() && form.en.slug.trim(),
  );

  function handleCreate() {
    if (!isEnglishComplete) {
      setActiveLocale(defaultLocale);
      toastManager.add({
        title: t("form.englishRequired"),
        type: "error",
        timeout: 3000,
      });
      return;
    }

    startTransition(async () => {
      try {
        const data: PageCreateFormData = {
          status: form.status,
          translations: {
            en: {
              title: form.en.title.trim(),
              slug: form.en.slug.trim(),
            },
            ...(form.fa.title.trim() && form.fa.slug.trim()
              ? {
                  fa: {
                    title: form.fa.title.trim(),
                    slug: form.fa.slug.trim(),
                  },
                }
              : {}),
            ...(form.de.title.trim() && form.de.slug.trim()
              ? {
                  de: {
                    title: form.de.title.trim(),
                    slug: form.de.slug.trim(),
                  },
                }
              : {}),
          },
        };

        const created = await createPageQuick(domainId, data);
        toastManager.add({
          title: t("createSuccess"),
          type: "success",
          timeout: 3000,
        });

        router.push(
          buildProjectHref(
            domainId,
            pathname,
            `/dashboard/page-builder/${created.id}/builder`,
          ),
        );
      } catch (error) {
        toastManager.add({
          title: getActionErrorMessage(error, t("error")),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("actions.createPage")} />

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("form.status")}</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as "draft" | "published",
                }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
                <SelectItem value="published">
                  {t("status.published")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <LocaleTabs value={activeLocale} onValueChange={setActiveLocale}>
          {(locale) => (
            <>
              <div className="space-y-2">
                <Label htmlFor={`title-${locale}`}>
                  {t("form.title")}
                  {locale === defaultLocale ? (
                    <span className="text-destructive ms-0.5">*</span>
                  ) : null}
                </Label>
                <Input
                  id={`title-${locale}`}
                  value={form[locale].title}
                  onChange={(e) => handleTitleChange(locale, e.target.value)}
                  disabled={isPending}
                  placeholder={`${t("form.title")} (${locale})`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`slug-${locale}`}>{t("form.slug")}</Label>
                <SlugField
                  id={`slug-${locale}`}
                  value={form[locale].slug}
                  locale={locale}
                  onChange={(value) => handleSlugChange(locale, value)}
                  disabled={isPending}
                  dir="ltr"
                />
              </div>
            </>
          )}
        </LocaleTabs>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            nativeButton={false}
            render={
              <Link
                href={buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/page-builder",
                )}
              />
            }
          >
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isPending || !isEnglishComplete}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("actions.create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
