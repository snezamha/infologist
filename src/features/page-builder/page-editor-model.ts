import type { PageStatus } from "@/features/page-builder/schemas";

import type { Locale } from "@/i18n/config";
import { pageStatuses } from "@/features/page-builder/schemas";
import type {
  PageFormData,
  PageRecord,
  PageTranslation,
} from "@/features/page-builder/types";
import { utcToZonedDateTimeInput } from "@/features/page-builder/scheduled-time";

export { pageStatuses };
export type PageEditorMode = "create" | "edit";

export type PageFieldSetter = <
  K extends Exclude<keyof PageFormData, "translations">,
>(
  key: K,
  value: PageFormData[K],
) => void;

export type PageTranslationFieldSetter = (
  locale: Locale,
  field: keyof PageTranslation,
  value: PageTranslation[keyof PageTranslation],
) => void;

function emptyTranslation(): PageTranslation {
  return {
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
}

export function getInitialPageForm(
  content?: PageRecord,
  homepagePageId: string | null = null,
  timezone = "UTC",
): PageFormData {
  return {
    slugEn: content?.slugEn ?? "",
    slugFa: content?.slugFa ?? "",
    slugDe: content?.slugDe ?? "",
    status: content?.status ?? "draft",
    translations: {
      en: content?.translations.en
        ? { ...content.translations.en }
        : emptyTranslation(),
      fa: content?.translations.fa
        ? { ...content.translations.fa }
        : emptyTranslation(),
      de: content?.translations.de
        ? { ...content.translations.de }
        : emptyTranslation(),
    },
    noIndex: content?.noIndex ?? false,
    scheduledAt: content?.scheduledAt
      ? utcToZonedDateTimeInput(content.scheduledAt, timezone)
      : null,
    isHomepage: Boolean(
      content?.id && homepagePageId && content.id === homepagePageId,
    ),
  };
}

export function createInitialSlugTouched(mode: PageEditorMode) {
  return mode === "edit"
    ? ({ en: true, fa: true, de: true } as const)
    : ({ en: false, fa: false, de: false } as const);
}

export function isPageStatus(value: string): value is PageStatus {
  return (pageStatuses as readonly string[]).includes(value);
}
