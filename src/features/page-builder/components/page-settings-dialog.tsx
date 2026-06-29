"use client";

import { Loader2, Save, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updatePage } from "@/features/page-builder/actions";
import {
  LocalePageCard,
  PageDetailsCard,
  TranslationWarningPanel,
} from "@/features/page-builder/components/page-editor-sections";
import { getInitialPageForm } from "@/features/page-builder/page-editor-model";
import type {
  PageFormData,
  PageRecord,
  PageTranslation,
} from "@/features/page-builder/types";
import type { Locale } from "@/i18n/config";
import { getActionErrorMessage } from "@/lib/errors/action-error";
import { toastManager } from "@/lib/toast-manager";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";
import { useUnsavedChanges } from "@/features/page-builder/components/use-unsaved-changes";

type Props = {
  domainId: string;
  content: PageRecord;
  homepagePageId?: string | null;
  onSaved: (content: PageRecord) => void;
};

export function PageSettingsDialog({
  domainId,
  content,
  homepagePageId = null,
  onSaved,
}: Props) {
  const t = useTranslations("pageBuilder");
  const { preferences } = useSiteDateTimeFormat();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PageFormData>(() =>
    getInitialPageForm(
      content,
      content.isHomepage ? content.id : null,
      preferences.timezone,
    ),
  );
  const [savedForm, setSavedForm] = useState<PageFormData>(() =>
    getInitialPageForm(
      content,
      content.isHomepage ? content.id : null,
      preferences.timezone,
    ),
  );
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  useUnsavedChanges(open && isDirty, t("actions.confirmLeave"));

  function setField<K extends Exclude<keyof PageFormData, "translations">>(
    key: K,
    value: PageFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setTranslationField(
    locale: Locale,
    field: keyof PageTranslation,
    value: PageTranslation[keyof PageTranslation],
  ) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: { ...current.translations[locale], [field]: value },
      },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const saved = await updatePage(domainId, content.id, form);
        const nextForm = getInitialPageForm(
          saved,
          saved.isHomepage ? saved.id : null,
          preferences.timezone,
        );
        setForm(nextForm);
        setSavedForm(nextForm);
        onSaved(saved);
        setOpen(false);
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (
          !nextOpen &&
          isDirty &&
          !window.confirm(t("actions.confirmLeave"))
        ) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Settings className="size-4" />
            <span className="hidden lg:inline">
              {t("actions.pageSettings")}
            </span>
          </Button>
        }
      />
      <DialogContent className="flex max-h-[92dvh] max-w-4xl flex-col p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{t("actions.pageSettings")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <TranslationWarningPanel form={form} />
          <LocalePageCard
            form={form}
            setField={setField}
            setTranslationField={setTranslationField}
            onSlugTouched={() => undefined}
          />
          <PageDetailsCard
            form={form}
            setField={setField}
            mode="edit"
            homepagePageId={homepagePageId}
            currentPageId={content.id}
          />
        </div>
        <DialogFooter className="border-t px-5 py-4">
          <Button
            type="button"
            disabled={isPending || !isDirty}
            onClick={handleSave}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
