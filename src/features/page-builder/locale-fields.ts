import type { Locale } from "@/i18n/config";

import type { PuckData } from "@/features/page-builder/puck/config";
import { normalizePuckData } from "@/features/page-builder/puck/data";

export type LocalizedSlugFields = {
  slugEn: string;
  slugFa?: string | null;
  slugDe?: string | null;
};

type WithTranslations = {
  translations: Record<
    Locale,
    {
      title: string;
      excerpt: string;
      builderData: unknown;
      seoTitle?: string;
      seoDescription?: string;
      navigationTitle?: string;
      ogImage?: string;
      canonicalUrl?: string;
      enabled?: boolean;
    }
  >;
};

export function getLocalizedSlug(fields: LocalizedSlugFields, locale: Locale) {
  if (locale === "fa") return fields.slugFa || fields.slugEn;
  if (locale === "de") return fields.slugDe || fields.slugEn;
  return fields.slugEn;
}

export function getLocalizedTitle(fields: WithTranslations, locale: Locale) {
  return (
    fields.translations[locale]?.title || fields.translations.en?.title || ""
  );
}

export function getLocalizedExcerpt(fields: WithTranslations, locale: Locale) {
  return (
    fields.translations[locale]?.excerpt ||
    fields.translations.en?.excerpt ||
    ""
  );
}

export function getLocalizedBuilderData(
  fields: WithTranslations,
  locale: Locale,
): PuckData {
  return normalizePuckData(fields.translations[locale]?.builderData);
}
