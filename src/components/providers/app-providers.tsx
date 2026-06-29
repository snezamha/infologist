"use client";

import { Toast } from "@base-ui/react/toast";
import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { Suspense, useLayoutEffect, useState, type ReactNode } from "react";

import { defaultTimeZone, type Locale } from "@/i18n/config";
import type { DateTimePreferences } from "@/lib/datetime/format";
import { toastManager } from "@/lib/toast-manager";
import type {
  LoadingColorMode,
  LoadingPosition,
} from "@/lib/site-settings/shared";
import { LoadingSettingsProvider } from "@/components/providers/loading-context";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "./theme-provider";
import { DateTimeFormatProvider } from "./datetime-format-provider";
import { DevBrowserStateGuard } from "./dev-browser-state-guard";

import { RouteLoadingIndicator } from "./route-loading-indicator";

type Props = {
  children: ReactNode;
  dir: "ltr" | "rtl";
  locale: Locale;
  messages: Record<string, unknown>;
  loadingEnabled: boolean;
  loadingSpinner: string;
  loadingPosition: LoadingPosition;
  loadingColorMode: LoadingColorMode;
  loadingColor: string;
  loadingSize: number;
  dateTimePreferences: DateTimePreferences;
};

export function AppProviders({
  children,
  dir,
  locale,
  messages,
  loadingEnabled,
  loadingSpinner,
  loadingPosition,
  loadingColorMode,
  loadingColor,
  loadingSize,
  dateTimePreferences,
}: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [dir, locale]);

  return (
    <ThemeProvider>
      <DirectionProvider dir={dir}>
        <QueryClientProvider client={queryClient}>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={dateTimePreferences.timezone || defaultTimeZone}
          >
            <DateTimeFormatProvider preferences={dateTimePreferences}>
              <LoadingSettingsProvider
                settings={{
                  spinner: loadingSpinner,
                  colorMode: loadingColorMode,
                  color: loadingColor,
                  size: loadingSize,
                }}
              >
                <Toast.Provider toastManager={toastManager}>
                  <DevBrowserStateGuard />
                  <Suspense fallback={null}>
                    <RouteLoadingIndicator
                      enabled={loadingEnabled}
                      spinner={loadingSpinner}
                      position={loadingPosition}
                      colorMode={loadingColorMode}
                      color={loadingColor}
                      size={loadingSize}
                    />
                  </Suspense>
                  {children}
                  <Toaster />
                </Toast.Provider>
              </LoadingSettingsProvider>
            </DateTimeFormatProvider>
          </NextIntlClientProvider>
        </QueryClientProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
