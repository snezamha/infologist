import type { Locale } from "@/i18n/config";

import { getLocalizedSlug } from "./locale-fields";
import type { PageRecord } from "./types";

const HOME_PAGE_SLUG = "home";

function getPagePublicHref(
  slug: string,
  options?: { isHomepage?: boolean },
): "/" | `/${string}` {
  if (options?.isHomepage || slug === HOME_PAGE_SLUG) {
    return "/";
  }

  return `/${slug}`;
}

export function getPageRecordPublicHref(
  content: Pick<
    PageRecord,
    "id" | "slugEn" | "slugFa" | "slugDe" | "isHomepage"
  >,
  locale: Locale,
  homepagePageId?: string | null,
): "/" | `/${string}` {
  const isHomepage =
    content.isHomepage ||
    Boolean(homepagePageId && content.id === homepagePageId);
  return getPagePublicHref(getLocalizedSlug(content, locale), { isHomepage });
}
