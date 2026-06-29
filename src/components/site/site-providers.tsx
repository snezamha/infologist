"use client";

import { Suspense, useLayoutEffect } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { Toast } from "@base-ui/react/toast";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { DateTimeFormatProvider } from "@/components/providers/datetime-format-provider";
import { DevBrowserStateGuard } from "@/components/providers/dev-browser-state-guard";
import { LoadingSettingsProvider } from "@/components/providers/loading-context";
import { RouteLoadingIndicator } from "@/components/providers/route-loading-indicator";
import { Toaster } from "@/components/ui/toast";
import type { DateTimePreferences } from "@/lib/datetime/format";
import type {
  LoadingColorMode,
  LoadingPosition,
} from "@/lib/site-settings/shared";
import { toastManager } from "@/lib/toast-manager";

type Props = {
  dir: "ltr" | "rtl";
  locale: string;
  dateTimePreferences: DateTimePreferences;
  loadingEnabled: boolean;
  loadingSpinner: string;
  loadingPosition: LoadingPosition;
  loadingColorMode: LoadingColorMode;
  loadingColor: string;
  loadingSize: number;
  children: React.ReactNode;
};

export function SiteProviders({
  dir,
  locale,
  dateTimePreferences,
  loadingEnabled,
  loadingSpinner,
  loadingPosition,
  loadingColorMode,
  loadingColor,
  loadingSize,
  children,
}: Props) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [dir, locale]);

  return (
    <ThemeProvider>
      <DirectionProvider dir={dir}>
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
      </DirectionProvider>
    </ThemeProvider>
  );
}
