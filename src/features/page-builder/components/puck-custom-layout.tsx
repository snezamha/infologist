"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createUsePuck, Puck } from "@puckeditor/core";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Monitor,
  Plus,
  Smartphone,
  Tablet,
} from "lucide-react";

import { PuckThemeEditor, type PageTheme } from "./puck-theme-editor";
import { PuckToolbarPortal } from "./puck-toolbar-portal";
import { useMobileViewport } from "./use-mobile-viewport";
import type { PuckConfig } from "@/features/page-builder/puck/config";

export type PuckEditorContextValue = {
  theme: PageTheme;
  onThemeChange: (theme: PageTheme) => void;
  toolbarRightSlot: HTMLElement | null;
  hasToolbarSlots: boolean;
};

export const PuckEditorContext = createContext<PuckEditorContextValue | null>(
  null,
);

const usePuckSelector = createUsePuck<PuckConfig>();

type ViewportWidth = number | "100%";

const VIEWPORT_PRESETS: {
  width: ViewportWidth;
  label: "mobile" | "tablet" | "desktop" | "fullWidthViewport";
  icon: React.ReactNode;
}[] = [
  { width: 360, label: "mobile", icon: <Smartphone size={14} /> },
  { width: 768, label: "tablet", icon: <Tablet size={14} /> },
  { width: 1280, label: "desktop", icon: <Monitor size={14} /> },
  { width: "100%", label: "fullWidthViewport", icon: <Maximize2 size={14} /> },
];

function ViewportBar() {
  const t = useTranslations("pageBuilder.builder");
  const dispatch = usePuckSelector((s) => s.dispatch);
  const activeWidth = usePuckSelector(
    (s) => s.appState.ui.viewports?.current?.width,
  );

  const setViewport = useCallback(
    (width: ViewportWidth) => {
      dispatch({
        type: "setUi",
        ui: (prev) => ({
          viewports: {
            ...prev.viewports,
            current: { width, height: "auto" as const },
          },
        }),
      });
    },
    [dispatch],
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 2,
        padding: "4px 8px",
        borderBottom: "1px solid var(--puck-color-grey-09, #e2e8f0)",
        background: "var(--puck-color-grey-12, #f9fafb)",
        flexShrink: 0,
      }}
    >
      {VIEWPORT_PRESETS.map(({ width, label, icon }) => (
        <button
          key={String(width)}
          type="button"
          title={t(label)}
          aria-label={t(label)}
          aria-pressed={activeWidth === width}
          onClick={() => setViewport(width)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 28,
            background:
              activeWidth === width
                ? "var(--puck-color-azure-11, #e8f1f8)"
                : "none",
            border:
              activeWidth === width
                ? "1px solid var(--puck-color-azure-07, #9dc3e8)"
                : "1px solid transparent",
            borderRadius: 4,
            cursor: "pointer",
            color:
              activeWidth === width
                ? "var(--puck-color-azure-05, #4d8fc9)"
                : "var(--puck-color-grey-05, #737373)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function pickPreset(containerWidth: number): ViewportWidth {
  if (containerWidth < 500) return 360;
  if (containerWidth < 900) return 768;
  if (containerWidth < 1400) return 1280;
  return "100%";
}

function PreviewWithViewport({
  isEmpty,
  onStart,
}: {
  isEmpty: boolean;
  onStart: () => void;
}) {
  const t = useTranslations("pageBuilder.builder");
  const dispatch = usePuckSelector((s) => s.dispatch);
  const viewportWidth = usePuckSelector(
    (s) => s.appState.ui.viewports?.current?.width ?? "100%",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const isFullWidth = viewportWidth === "100%";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preset = pickPreset(el.getBoundingClientRect().width);
    dispatch({
      type: "setUi",
      ui: (prev) => ({
        viewports: {
          ...prev.viewports,
          current: { width: preset, height: "auto" as const },
        },
      }),
    });
  }, [dispatch]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: isFullWidth ? "hidden" : "auto",
        display: "flex",
        justifyContent: "center",
        background: isFullWidth
          ? undefined
          : "var(--puck-color-grey-11, #e8eaed)",
      }}
    >
      <div
        style={{
          width: viewportWidth,
          height: "100%",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Puck.Preview />
        {isEmpty ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "min(100%, 360px)",
                padding: 24,
                border: "1px dashed var(--puck-color-grey-08, #cbd5e1)",
                borderRadius: 12,
                background: "var(--puck-color-white, #fff)",
                textAlign: "center",
                boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
                pointerEvents: "auto",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {t("emptyTitle")}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "var(--puck-color-grey-05, #737373)",
                }}
              >
                {t("emptyDescription")}
              </div>
              <button
                type="button"
                onClick={onStart}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 16,
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: 7,
                  background: "var(--puck-color-azure-05, #4d8fc9)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Plus size={14} />
                {t("addFirstBlock")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Tab = "components" | "fields" | "outline";

const TABS: Tab[] = ["components", "fields", "outline"];

const PANEL_HEIGHT = 320;

function TabBtn({
  label,
  active,
  compact,
  onClick,
}: {
  label: string;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: compact ? "10px 8px" : "10px 14px",
        fontSize: compact ? 11 : 12,
        fontWeight: active ? 600 : 400,
        color: active
          ? "var(--puck-color-azure-05, #4d8fc9)"
          : "var(--puck-color-grey-05, #737373)",
        borderTop: "none",
        borderInlineStart: "none",
        borderInlineEnd: "none",
        borderBottom: `2px solid ${
          active ? "var(--puck-color-azure-05, #4d8fc9)" : "transparent"
        }`,
        background: "none",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function PuckCustomLayout() {
  const t = useTranslations("pageBuilder.builder");
  const ctx = useContext(PuckEditorContext);
  const isMobile = useMobileViewport();
  const contentLength = usePuckSelector(
    (state) => state.appState.data.content.length,
  );

  const [activeTab, setActiveTab] = useState<Tab>("components");
  const [expanded, setExpanded] = useState(contentLength === 0);
  const manualRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = usePuckSelector((s) => s.appState.ui.itemSelector);

  useEffect(() => {
    if (manualRef.current) return;
    if (selected) {
      queueMicrotask(() => {
        setActiveTab("fields");
        setExpanded(true);
      });
    }
  }, [selected]);

  const handleTabClick = useCallback(
    (tab: Tab) => {
      if (activeTab === tab && expanded) {
        setExpanded(false);
      } else {
        setActiveTab(tab);
        setExpanded(true);
      }
      manualRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        manualRef.current = false;
      }, 4000);
    },
    [activeTab, expanded],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {ctx?.hasToolbarSlots && (
        <PuckToolbarPortal rightSlot={ctx.toolbarRightSlot} />
      )}

      <PreviewWithViewport
        isEmpty={contentLength === 0}
        onStart={() => {
          setActiveTab("components");
          setExpanded(true);
        }}
      />

      <div
        style={{
          flexShrink: 0,
          background: "var(--puck-color-white, #fff)",
          borderTop: "1px solid var(--puck-color-grey-09, #e2e8f0)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ViewportBar />

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            background: "var(--puck-color-grey-12, #f9fafb)",
            borderBottom: expanded
              ? "1px solid var(--puck-color-grey-09, #e2e8f0)"
              : "none",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {TABS.map((id) => (
            <TabBtn
              key={id}
              label={t(isMobile ? `mobileTabs.${id}` : id)}
              active={activeTab === id && expanded}
              compact={isMobile}
              onClick={() => handleTabClick(id)}
            />
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {ctx && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingInlineEnd: 4,
                }}
              >
                <PuckThemeEditor
                  theme={ctx.theme}
                  onChange={ctx.onThemeChange}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={t(expanded ? "collapsePanel" : "expandPanel")}
              aria-label={t(expanded ? "collapsePanel" : "expandPanel")}
              style={{
                padding: "0 10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--puck-color-grey-05, #737373)",
                display: "flex",
                alignItems: "center",
                borderInlineStart:
                  "1px solid var(--puck-color-grey-09, #e2e8f0)",
                height: "100%",
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div
            style={{
              height: isMobile ? "min(42dvh, 320px)" : PANEL_HEIGHT,
              overflow: "auto",
              padding: "8px 12px",
            }}
          >
            {activeTab === "components" && <Puck.Components />}
            {activeTab === "fields" && <Puck.Fields />}
            {activeTab === "outline" && <Puck.Outline />}
          </div>
        )}
      </div>
    </div>
  );
}
