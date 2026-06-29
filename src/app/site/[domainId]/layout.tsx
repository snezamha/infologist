import "@/styles/globals.css";
import "react-image-crop/dist/ReactCrop.css";

import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import Script from "next/script";

import { PatchPerformanceScript } from "@/components/patch-performance-script";
import { SiteClerkProvider } from "@/components/site/site-clerk-provider";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";
import { parseLoadingSettings } from "@/lib/site-settings/loading";
import { parseThemeSettings } from "@/lib/site-settings/theme";
import { generateThemeCss } from "@/lib/theme/presets";
import { SiteProviders } from "@/components/site/site-providers";
import { ThemeScript } from "@/components/theme-script";
import { fontVariables } from "@/config/fonts";
import { defaultTimeZone } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { getDateTimePreferences } from "@/lib/datetime/format";
import { loadMessages } from "@/i18n/load-messages";
import { parseGeneralSettings } from "@/lib/site-settings/general";
import { getProjectFeatures } from "@/features/_core/lib";

type Props = {
  children: React.ReactNode;
  params: Promise<{ domainId: string }>;
};

export default async function SiteLayout({ children, params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);

  if (!project) notFound();

  const [config, settings, features] = await Promise.all([
    getProjectConfig(project.id),
    getPublicProjectSettings(project.id),
    getProjectFeatures(project.id),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);
  const messages = await loadMessages(context.locale);
  const general = parseGeneralSettings(settings.general);
  const dateTimePreferences = getDateTimePreferences(general, context.locale);

  const appearanceObj = settings.appearance as Record<string, unknown> | null;
  const loading = parseLoadingSettings(appearanceObj?.loadingSettings);
  const theme = parseThemeSettings(appearanceObj?.themeSettings);
  const themeCss = generateThemeCss(
    theme.color,
    theme.radius,
    theme.customColor,
  );

  const content = config.clerkPublishableKey ? (
    <SiteClerkProvider publishableKey={config.clerkPublishableKey}>
      {children}
    </SiteClerkProvider>
  ) : (
    children
  );

  return (
    <html
      lang={context.locale}
      dir={context.dir}
      suppressHydrationWarning
      className={cn(fontVariables, "h-full")}
    >
      <body
        dir={context.dir}
        suppressHydrationWarning
        style={{
          fontFamily:
            context.locale === "fa"
              ? "var(--font-vazir), var(--font-inter)"
              : "var(--font-inter), var(--font-vazir)",
        }}
        className="min-h-full antialiased"
      >
        <ThemeScript />
        <PatchPerformanceScript />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        {features.statistics.enabled && (
          <>
            <Script
              id="project-domain"
              dangerouslySetInnerHTML={{
                __html: `window.__projectDomain=${JSON.stringify(domainId)};`,
              }}
              strategy="afterInteractive"
            />
            <Script src="/analytics.js" strategy="afterInteractive" />
          </>
        )}
        <NextIntlClientProvider
          locale={context.locale}
          messages={messages}
          timeZone={dateTimePreferences.timezone || defaultTimeZone}
        >
          <SiteProviders
            dir={context.dir}
            locale={context.locale}
            dateTimePreferences={dateTimePreferences}
            loadingEnabled={loading.enabled}
            loadingSpinner={loading.spinner}
            loadingPosition={loading.position}
            loadingColorMode={loading.colorMode}
            loadingColor={loading.color}
            loadingSize={loading.size}
          >
            {content}
          </SiteProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
