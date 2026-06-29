import type { PageStatus } from "@/features/page-builder/schemas";

import type { Locale } from "@/i18n/config";
import type { PuckData } from "@/features/page-builder/puck/config";
import { pageStatuses } from "@/features/page-builder/schemas";

export type PageTranslation = {
  title: string;
  excerpt: string;
  builderData: PuckData | null;
  seoTitle: string;
  seoDescription: string;
  navigationTitle: string;
  ogImage: string;
  canonicalUrl: string;
  enabled: boolean;
};

export type PageRecord = {
  id: string;
  slugEn: string;
  slugFa: string | null;
  slugDe: string | null;
  status: PageStatus;
  isHomepage: boolean;
  translations: Record<Locale, PageTranslation>;
  themeData: Record<string, unknown> | null;
  noIndex: boolean;
  authorId: string;
  authorName: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

type PageCreateTranslation = {
  title: string;
  slug: string;
};

export type PageCreateFormData = {
  status: PageStatus;
  translations: {
    en: PageCreateTranslation;
    fa?: PageCreateTranslation;
    de?: PageCreateTranslation;
  };
};

export type PageFormData = {
  slugEn: string;
  slugFa: string;
  slugDe: string;
  status: PageStatus;
  translations: Record<Locale, PageTranslation>;
  noIndex: boolean;
  scheduledAt: string | null;
  isHomepage: boolean;
};

export function parsePageStatus(value: string | undefined): PageStatus | "all" {
  return (pageStatuses as readonly string[]).includes(value ?? "")
    ? (value as PageStatus)
    : "all";
}
