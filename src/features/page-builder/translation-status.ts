import type { Locale } from "@/i18n/config";

import { hasPuckContent } from "@/features/page-builder/puck/data";
import type { PageFormData } from "./types";

type LocaleField = Exclude<Locale, "en">;

type TranslationWarningContent = Pick<PageFormData, "translations">;

export type TranslationWarning = {
  locale: LocaleField;
  missingTitle: boolean;
  missingBody: boolean;
};

export function getTranslationWarnings(
  form: TranslationWarningContent,
): TranslationWarning[] {
  const en = form.translations.en;
  const hasEnglishTitle = en.title.trim().length > 0;

  if (!hasEnglishTitle) {
    return [];
  }

  const hasEnglishPuck = hasPuckContent(en.builderData);

  if (!hasEnglishPuck) {
    return [];
  }

  const nonEnglishLocales: LocaleField[] = ["fa", "de"];

  return nonEnglishLocales.map((locale) => {
    const t = form.translations[locale];
    if (!t.enabled) {
      return {
        locale,
        missingTitle: false,
        missingBody: false,
      };
    }
    return {
      locale,
      missingTitle: !t.title.trim(),
      missingBody: !hasPuckContent(t.builderData),
    };
  });
}

export function hasTranslationWarnings(
  form: TranslationWarningContent,
): boolean {
  return getTranslationWarnings(form).some(
    (warning) => warning.missingTitle || warning.missingBody,
  );
}
