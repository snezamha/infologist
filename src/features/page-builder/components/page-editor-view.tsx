"use client";

import { ArrowLeft, LayoutPanelLeft, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { buildProjectHref } from "@/lib/projects/project/site";
import type { Locale } from "@/i18n/config";
import { slugFromTitle } from "@/features/page-builder/slug";
import type {
  PageFormData,
  PageRecord,
  PageTranslation,
} from "@/features/page-builder/types";
import { getActionErrorMessage } from "@/lib/errors/action-error";
import { toastManager } from "@/lib/toast-manager";

import { createPage, updatePage } from "@/features/page-builder/actions";
import {
  createInitialSlugTouched,
  getInitialPageForm,
  type PageEditorMode,
} from "@/features/page-builder/page-editor-model";
import {
  PageDetailsCard,
  LocaleTabsCard,
  LocalePageCard,
  TranslationWarningPanel,
} from "@/features/page-builder/components/page-editor-sections";
import { useUnsavedChanges } from "@/features/page-builder/components/use-unsaved-changes";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";

type Props = {
  domainId: string;
  mode: PageEditorMode;
  content?: PageRecord;
  homepagePageId?: string | null;
};

export function PageEditorView({
  domainId,
  mode,
  content,
  homepagePageId = null,
}: Props) {
  const t = useTranslations("pageBuilder");
  const router = useRouter();
  const pathname = usePathname();
  const { preferences } = useSiteDateTimeFormat();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PageFormData>(() =>
    getInitialPageForm(content, homepagePageId, preferences.timezone),
  );
  const [lastSavedForm, setLastSavedForm] = useState<PageFormData>(() =>
    getInitialPageForm(content, homepagePageId, preferences.timezone),
  );
  const [slugTouched, setSlugTouched] = useState(
    createInitialSlugTouched(mode),
  );
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(lastSavedForm),
    [form, lastSavedForm],
  );

  useUnsavedChanges(isDirty, t("actions.confirmLeave"));

  function setField<K extends Exclude<keyof PageFormData, "translations">>(
    key: K,
    value: PageFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTranslationField(
    locale: Locale,
    field: keyof PageTranslation,
    value: PageTranslation[keyof PageTranslation],
  ) {
    setForm((prev) => {
      const next: PageFormData = {
        ...prev,
        translations: {
          ...prev.translations,
          [locale]: { ...prev.translations[locale], [field]: value },
        },
      };

      if (field === "title" && !slugTouched[locale]) {
        const title = String(value);
        if (locale === "en") next.slugEn = slugFromTitle(title, "en");
        else if (locale === "fa") next.slugFa = slugFromTitle(title, "fa");
        else if (locale === "de") next.slugDe = slugFromTitle(title, "de");
      }

      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createPage(domainId, form);
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
          return;
        }

        if (!content) {
          throw new Error("Missing page");
        }

        const saved = await updatePage(domainId, content.id, form);
        const nextHomepagePageId = form.isHomepage
          ? saved.id
          : homepagePageId === saved.id
            ? null
            : homepagePageId;
        const nextForm = getInitialPageForm(
          saved,
          nextHomepagePageId,
          preferences.timezone,
        );
        setForm(nextForm);
        setLastSavedForm(nextForm);
        toastManager.add({
          title: t("saved"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: getActionErrorMessage(error, t("error"), {
            homepageAlreadySet: t("form.homepageAlreadySet"),
          }),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <form id="page-editor-form" onSubmit={handleSubmit} className="space-y-6">
        <DashboardPageHeader
          title={mode === "create" ? t("createTitle") : t("editTitle")}
          description={mode === "edit" ? t("editDescription") : undefined}
          meta={isDirty ? t("status.unsavedChanges") : undefined}
          actions={
            <>
              <Button
                nativeButton={false}
                variant="outline"
                size="sm"
                className="gap-2"
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
                <ArrowLeft className="size-4 shrink-0 rtl:rotate-180" />
                <span className="hidden sm:inline">
                  {t("actions.backToList")}
                </span>
                <span className="sr-only sm:hidden">
                  {t("actions.backToList")}
                </span>
              </Button>
              {mode === "edit" && content ? (
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  render={
                    <Link
                      href={buildProjectHref(
                        domainId,
                        pathname,
                        `/dashboard/page-builder/${content.id}/builder`,
                      )}
                    />
                  }
                >
                  <LayoutPanelLeft className="size-4 shrink-0" />
                  <span className="hidden sm:inline">
                    {t("actions.openPageBuilder")}
                  </span>
                  <span className="sr-only sm:hidden">
                    {t("actions.openPageBuilder")}
                  </span>
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                className="gap-2"
                disabled={isPending || !isDirty}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {mode === "create" ? t("actions.create") : t("actions.save")}
                </span>
                <span className="sr-only sm:hidden">
                  {mode === "create" ? t("actions.create") : t("actions.save")}
                </span>
              </Button>
            </>
          }
        />

        <TranslationWarningPanel form={form} />

        <LocaleTabsCard form={form} />

        <LocalePageCard
          form={form}
          setField={setField}
          setTranslationField={setTranslationField}
          onSlugTouched={(locale) =>
            setSlugTouched((current) => ({ ...current, [locale]: true }))
          }
        />
        <PageDetailsCard
          form={form}
          setField={setField}
          mode={mode}
          homepagePageId={homepagePageId}
          currentPageId={content?.id}
        />
      </form>
    </div>
  );
}
