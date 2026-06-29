import type { Locale } from "@/i18n/config";
import type { ProjectDbPage } from "@/lib/projects/project/_db";
import { parsePuckData } from "@/features/page-builder/puck/data";

import type { PageRecord, PageTranslation } from "./types";

const emptyTranslation: PageTranslation = {
  title: "",
  excerpt: "",
  builderData: null,
  seoTitle: "",
  seoDescription: "",
  navigationTitle: "",
  ogImage: "",
  canonicalUrl: "",
  enabled: true,
};

function toPageTranslation(
  page: ProjectDbPage,
  locale: Locale,
): PageTranslation {
  const found = page.translations.find((item) => item.locale === locale);
  if (!found) return { ...emptyTranslation };

  return {
    title: found.title,
    excerpt: found.excerpt,
    builderData: parsePuckData(found.builderData),
    seoTitle: found.seoTitle,
    seoDescription: found.seoDescription,
    navigationTitle: found.navigationTitle,
    ogImage: found.ogImage,
    canonicalUrl: found.canonicalUrl,
    enabled: found.enabled,
  };
}

function localeSlug(page: ProjectDbPage, locale: Locale): string {
  return page.translations.find((item) => item.locale === locale)?.slug ?? "";
}

export function mapPageRecord(
  page: ProjectDbPage,
  authorName: string | null = null,
): PageRecord {
  return {
    id: page.id,
    slugEn: localeSlug(page, "en"),
    slugFa: localeSlug(page, "fa") || null,
    slugDe: localeSlug(page, "de") || null,
    status: page.status as PageRecord["status"],
    isHomepage: page.isHomepage,
    translations: {
      en: toPageTranslation(page, "en"),
      fa: toPageTranslation(page, "fa"),
      de: toPageTranslation(page, "de"),
    },
    themeData: page.themeData,
    noIndex: page.noIndex,
    authorId: page.authorId,
    authorName,
    scheduledAt: page.scheduledAt,
    publishedAt: page.publishedAt,
    updatedAt: page.updatedAt,
  };
}
