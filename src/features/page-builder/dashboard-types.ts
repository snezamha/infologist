import type { PageStatus } from "@/features/page-builder/schemas";

import type { Locale } from "@/i18n/config";

export type DashboardPage = {
  id: string;
  slugEn: string;
  slugFa: string | null;
  slugDe: string | null;
  status: PageStatus;
  isHomepage: boolean;
  translations: Record<Locale, { title: string }>;
  authorName: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};
