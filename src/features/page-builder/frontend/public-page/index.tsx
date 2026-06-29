import { PuckPageContent } from "@/features/page-builder/components/puck-page-content";
import type { Locale } from "@/i18n/config";
import {
  getLocalizedExcerpt,
  getLocalizedBuilderData,
  getLocalizedTitle,
} from "@/features/page-builder/locale-fields";
import type { PageRecord } from "@/features/page-builder/types";
import { parseThemeData, themeToCSS } from "@/features/page-builder/theme";

type Props = {
  content: PageRecord;
  locale: Locale;
};

export function PublicPageView({ content, locale }: Props) {
  const title = getLocalizedTitle(content, locale);
  const excerpt = getLocalizedExcerpt(content, locale);
  const puckData = getLocalizedBuilderData(content, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    headline: title,
    description: excerpt || undefined,
    datePublished: content.publishedAt?.toISOString(),
    dateModified: content.updatedAt.toISOString(),
  };

  const themeCSS = themeToCSS(parseThemeData(content.themeData));

  return (
    <main
      className="bg-background min-h-screen"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--font-size-base)",
        fontWeight: "var(--font-weight-normal)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PuckPageContent data={puckData} locale={locale} />
    </main>
  );
}
