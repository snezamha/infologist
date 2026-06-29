import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { PatchPerformanceScript } from "@/components/patch-performance-script";
import { ThemeScript } from "@/components/theme-script";
import { type Locale, getDirection } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/config/fonts";
import { cn } from "@/lib/utils";
import { getDateTimePreferences } from "@/lib/datetime/format";
import { getAppearanceSettings } from "@/lib/settings";
import { defaultGeneralSettings } from "@/lib/site-settings/general";
import { generateThemeCss } from "@/lib/theme/presets";

import "@/styles/globals.css";
import "react-image-crop/dist/ReactCrop.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const t = await getTranslations({
    locale: localeParam as Locale,
    namespace: "metadata",
  });
  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;

  if (!hasLocale(routing.locales, localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;

  setRequestLocale(locale);

  const [messages, settings] = await Promise.all([
    getMessages(),
    getAppearanceSettings(),
  ]);

  const dir = getDirection(locale);
  const themeCss = generateThemeCss(
    settings.themeColor,
    settings.themeRadius,
    settings.themeCustomColor,
  );
  const dateTimePreferences = getDateTimePreferences(
    defaultGeneralSettings,
    locale,
  );

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(fontVariables, "h-full")}
    >
      <body
        dir={dir}
        suppressHydrationWarning
        style={{
          fontFamily:
            locale === "fa"
              ? "var(--font-vazir), var(--font-inter)"
              : "var(--font-inter), var(--font-vazir)",
        }}
        className="min-h-full antialiased"
      >
        <ThemeScript />
        <PatchPerformanceScript />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <AppProviders
          key={locale}
          dir={dir}
          locale={locale}
          messages={messages}
          loadingEnabled={settings.loadingEnabled}
          loadingSpinner={settings.loadingSpinner}
          loadingPosition={settings.loadingPosition}
          loadingColorMode={settings.loadingColorMode}
          loadingColor={settings.loadingColor}
          loadingSize={settings.loadingSize}
          dateTimePreferences={dateTimePreferences}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
