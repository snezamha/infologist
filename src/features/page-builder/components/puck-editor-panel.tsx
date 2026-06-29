"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createUsePuck,
  Puck,
  type Config,
  type Data,
  type Overrides,
} from "@puckeditor/core";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import "@puckeditor/core/puck.css";
import "@/features/page-builder/styles/puck-dark.css";
import "@/features/page-builder/styles/puck-mobile.css";

import { PuckThemeSync } from "@/features/page-builder/components/puck-theme-sync";
import {
  PuckEditorContext,
  PuckCustomLayout,
} from "@/features/page-builder/components/puck-custom-layout";
import type { PageTheme } from "@/features/page-builder/components/puck-theme-editor";
import { PuckThemeInjector } from "@/features/page-builder/components/puck-theme-injector";
import { Button } from "@/components/ui/button";
import { puckConfig, type PuckData } from "@/features/page-builder/puck/config";
import { cn } from "@/lib/utils";
import { useMobileViewport } from "./use-mobile-viewport";
import { parseThemeData, themeToCSS } from "@/features/page-builder/theme";
import { getPuckMetadata } from "@/features/page-builder/puck/localization";
import { getLocalizedPuckConfig } from "@/features/page-builder/puck/localization";
import { getDirection, type Locale } from "@/i18n/config";

const usePuckSelector = createUsePuck<typeof puckConfig>();
const ROOT_ZONE = "root:default-zone";
const THEME_STYLE_ID = "puck-page-theme";

function IframeThemeStyle({
  document: doc,
  cssRef,
  onReadyRef,
  locale,
}: {
  document?: Document;
  cssRef: React.RefObject<string>;
  onReadyRef: React.RefObject<(() => void) | undefined>;
  locale: Locale;
}) {
  useLayoutEffect(() => {
    if (!doc?.head) return;
    if (doc.documentElement) {
      doc.documentElement.setAttribute("dir", getDirection(locale));
      doc.documentElement.setAttribute("lang", locale);
    }
    if (doc.body) {
      doc.body.setAttribute("dir", getDirection(locale));
    }
    let el = doc.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = doc.createElement("style");
      el.id = THEME_STYLE_ID;
      el.textContent = cssRef.current;
      doc.head.appendChild(el);
    }
    onReadyRef.current?.();
    const node = el;
    return () => {
      try {
        node.parentNode?.removeChild(node);
      } catch {}
    };
  }, [doc, cssRef, locale, onReadyRef]);
  return null;
}

function MobileDrawerItem({ name }: { children: ReactNode; name: string }) {
  const dispatch = usePuckSelector((state) => state.dispatch);
  const contentLength = usePuckSelector(
    (state) => state.appState.data.content.length,
  );
  const label = usePuckSelector((state) => {
    const components = state.config.components as Record<
      string,
      { label?: string }
    >;
    return components[name]?.label ?? name;
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full justify-between px-4 text-start"
      onClick={() => {
        dispatch({
          type: "insert",
          componentType: name,
          destinationIndex: contentLength,
          destinationZone: ROOT_ZONE,
          recordHistory: true,
        });
        dispatch({
          type: "setUi",
          ui: { itemSelector: { index: contentLength, zone: ROOT_ZONE } },
        });
      }}
    >
      <span>{label}</span>
      <Plus />
    </Button>
  );
}

type Props = {
  data: PuckData;
  onChange: (data: PuckData) => void;
  fullScreen?: boolean;
  headerTitle: string;
  height?: number | string;
  toolbarRightSlot?: HTMLElement | null;
  initialTheme?: Record<string, unknown> | null;
  onThemeChange?: (theme: Record<string, unknown>) => void;
  onReady?: () => void;
  locale: Locale;
};

export function PuckEditorPanel({
  data,
  onChange,
  fullScreen = false,
  headerTitle,
  height,
  toolbarRightSlot,
  initialTheme,
  onThemeChange,
  onReady,
  locale,
}: Props) {
  const [theme, setTheme] = useState<PageTheme>(() =>
    parseThemeData(initialTheme),
  );

  const cssRef = useRef(themeToCSS(parseThemeData(initialTheme)));
  useEffect(() => {
    cssRef.current = themeToCSS(theme);
  }, [theme]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const handleThemeChange = useCallback(
    (next: PageTheme) => {
      setTheme(next);
      onThemeChange?.(next as unknown as Record<string, unknown>);
    },
    [onThemeChange],
  );

  const iframeOverride = useCallback(
    ({
      children,
      document: iframeDoc,
    }: {
      children: ReactNode;
      document?: Document;
    }) => (
      <>
        <IframeThemeStyle
          document={iframeDoc}
          cssRef={cssRef}
          onReadyRef={onReadyRef}
          locale={locale}
        />
        {children}
      </>
    ),
    [locale],
  );

  const resolvedHeight = fullScreen ? undefined : height;
  const hasToolbarSlots = Boolean(toolbarRightSlot);
  const isMobile = useMobileViewport();
  const dragEnabled = !isMobile;
  const editorMetadata = useMemo(() => getPuckMetadata(locale), [locale]);
  const editorConfig = useMemo(() => getLocalizedPuckConfig(locale), [locale]);

  const contextValue = useMemo(
    () => ({
      theme,
      onThemeChange: handleThemeChange,
      toolbarRightSlot: toolbarRightSlot ?? null,
      hasToolbarSlots,
    }),
    [theme, handleThemeChange, toolbarRightSlot, hasToolbarSlots],
  );

  const puckOverride = useCallback(() => <PuckCustomLayout />, []);

  const overrides = useMemo(
    () =>
      ({
        puck: puckOverride,
        iframe: iframeOverride,
        ...(isMobile ? { drawerItem: MobileDrawerItem } : {}),
      }) satisfies Partial<Overrides<typeof puckConfig>>,
    [puckOverride, iframeOverride, isMobile],
  );

  return (
    <PuckEditorContext.Provider value={contextValue}>
      <div
        dir={getDirection(locale)}
        className={cn(
          fullScreen
            ? "h-full min-h-0 max-md:overflow-visible md:overflow-hidden [&_.Puck]:h-full"
            : "border-border overflow-hidden rounded-lg border [&_.Puck]:min-h-[520px]",
        )}
        style={
          !fullScreen && typeof resolvedHeight === "number"
            ? { height: resolvedHeight }
            : !fullScreen && typeof resolvedHeight === "string"
              ? { height: resolvedHeight, minHeight: 480 }
              : undefined
        }
      >
        <PuckThemeSync />
        <PuckThemeInjector theme={theme} />
        <Puck
          config={editorConfig as Config}
          data={data as Data}
          metadata={editorMetadata}
          permissions={dragEnabled ? undefined : { drag: false }}
          onChange={onChange as unknown as (data: Data) => void}
          headerTitle={headerTitle}
          {...(resolvedHeight !== undefined ? { height: resolvedHeight } : {})}
          _experimentalFullScreenCanvas={fullScreen}
          overrides={overrides}
        />
      </div>
    </PuckEditorContext.Provider>
  );
}
