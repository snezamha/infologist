"use client";

import { useCallback, useState } from "react";
import { Check, Palette, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorPickerField } from "@/features/page-builder/puck/fields/color-picker";
import { GapSliderField } from "@/features/page-builder/puck/fields/gap-slider";
import { useMobileViewport } from "@/features/page-builder/components/use-mobile-viewport";
import type { PageTheme } from "@/features/page-builder/theme";
import { DEFAULT_PAGE_THEME, themeToCSS } from "@/features/page-builder/theme";

export type { PageTheme };
export { DEFAULT_PAGE_THEME, themeToCSS };

type ThemeColorPreset = {
  id: "neutral" | "ocean" | "forest" | "sunset";
  colors: Pick<
    PageTheme,
    | "primary"
    | "primaryForeground"
    | "secondary"
    | "background"
    | "foreground"
    | "muted"
    | "mutedForeground"
    | "border"
  >;
};

const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  {
    id: "neutral",
    colors: {
      primary: "#18181b",
      primaryForeground: "#fafafa",
      secondary: "#f4f4f5",
      background: "#ffffff",
      foreground: "#09090b",
      muted: "#f4f4f5",
      mutedForeground: "#71717a",
      border: "#e4e4e7",
    },
  },
  {
    id: "ocean",
    colors: {
      primary: "#0369a1",
      primaryForeground: "#ffffff",
      secondary: "#e0f2fe",
      background: "#f8fcff",
      foreground: "#0c4a6e",
      muted: "#e0f2fe",
      mutedForeground: "#4b6472",
      border: "#bae6fd",
    },
  },
  {
    id: "forest",
    colors: {
      primary: "#15803d",
      primaryForeground: "#ffffff",
      secondary: "#dcfce7",
      background: "#fbfefc",
      foreground: "#14532d",
      muted: "#dcfce7",
      mutedForeground: "#4b6354",
      border: "#bbf7d0",
    },
  },
  {
    id: "sunset",
    colors: {
      primary: "#c2410c",
      primaryForeground: "#ffffff",
      secondary: "#ffedd5",
      background: "#fffaf5",
      foreground: "#7c2d12",
      muted: "#ffedd5",
      mutedForeground: "#785548",
      border: "#fed7aa",
    },
  },
];

const THEME_COLOR_KEYS: (keyof ThemeColorPreset["colors"])[] = [
  "primary",
  "primaryForeground",
  "secondary",
  "background",
  "foreground",
  "muted",
  "mutedForeground",
  "border",
];

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 5,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--puck-color-grey-05, #737373)",
};

const inputStyle = {
  padding: "6px 10px",
  fontSize: 12,
  border: "1px solid var(--puck-color-grey-09, #e2e8f0)",
  borderRadius: 6,
  background: "var(--puck-color-white, #fff)",
  color: "var(--puck-color-black, #000)",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
};

function ThemeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground border-b pb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ColorRow({
  label,
  fieldKey,
  theme,
  onChange,
}: {
  label: string;
  fieldKey: keyof PageTheme;
  theme: PageTheme;
  onChange: (key: keyof PageTheme, value: string) => void;
}) {
  const id = `theme-${fieldKey}`;
  const field = { type: "custom" as const, render: ColorPickerField };

  return (
    <div style={fieldStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <ColorPickerField
        field={field}
        name={fieldKey}
        id={id}
        value={theme[fieldKey] as string}
        onChange={(value) => onChange(fieldKey, value)}
      />
    </div>
  );
}

function SliderRow({
  label,
  fieldKey,
  theme,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  fieldKey: keyof PageTheme;
  theme: PageTheme;
  onChange: (key: keyof PageTheme, value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  const id = `theme-${fieldKey}`;
  const field = {
    type: "custom" as const,
    min,
    max,
    render: GapSliderField,
  };

  return (
    <div style={fieldStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}{" "}
        <span className="text-primary font-mono">
          {theme[fieldKey]}
          {suffix}
        </span>
      </label>
      <GapSliderField
        field={field}
        name={fieldKey}
        id={id}
        value={theme[fieldKey] as number}
        onChange={(value) => onChange(fieldKey, value)}
      />
    </div>
  );
}

type Props = {
  theme: PageTheme;
  onChange: (theme: PageTheme) => void;
};

export function PuckThemeEditor({ theme, onChange }: Props) {
  const t = useTranslations("pageBuilder.builder");
  const isMobile = useMobileViewport();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PageTheme>(theme);

  const handleOpen = () => {
    setDraft(theme);
    setOpen(true);
  };

  const handleColor = useCallback((key: keyof PageTheme, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleNumber = useCallback((key: keyof PageTheme, value: number) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleText = useCallback((key: keyof PageTheme, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const selectedPresetId = THEME_COLOR_PRESETS.find((preset) =>
    THEME_COLOR_KEYS.every((key) => preset.colors[key] === draft[key]),
  )?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(theme);
        setOpen(nextOpen);
      }}
    >
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("theme")}
        title={t("theme")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: isMobile ? 7 : "6px 12px",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--puck-color-grey-04, #ccc)",
          background: "transparent",
          border: "1px solid var(--puck-color-grey-09, #444)",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        <Palette size={14} />
        {isMobile ? null : t("theme")}
      </button>

      <DialogContent
        closeLabel={t("close")}
        className="flex max-h-[92dvh] max-w-2xl flex-col gap-0 p-0 sm:max-h-[90dvh]"
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pe-12">
          <DialogTitle>{t("themeEditor")}</DialogTitle>
          <DialogDescription>{t("themeDescription")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <ThemeSection title={t("presets")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEME_COLOR_PRESETS.map((preset) => {
                const selected = selectedPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        ...preset.colors,
                      }))
                    }
                    className="flex min-h-24 items-center justify-center rounded-xl border px-3 py-4 text-center text-sm font-medium transition-colors"
                    style={{
                      border: `2px solid ${selected ? preset.colors.primary : preset.colors.border}`,
                      background: preset.colors.background,
                      color: preset.colors.foreground,
                      cursor: "pointer",
                    }}
                  >
                    <span className="block w-full text-center">
                      {t(`preset.${preset.id}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </ThemeSection>

          <ThemeSection title={t("mainColors")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorRow
                label={t("primary")}
                fieldKey="primary"
                theme={draft}
                onChange={handleColor}
              />
              <ColorRow
                label={t("background")}
                fieldKey="background"
                theme={draft}
                onChange={handleColor}
              />
              <ColorRow
                label={t("foreground")}
                fieldKey="foreground"
                theme={draft}
                onChange={handleColor}
              />
            </div>
          </ThemeSection>

          <details className="group rounded-lg border px-4 py-2">
            <summary className="text-muted-foreground cursor-pointer py-2 text-sm font-medium">
              {t("advancedSettings")}
            </summary>
            <div className="space-y-6 py-4">
              <ThemeSection title={t("moreColors")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["primaryForeground", "primaryForeground"],
                      ["secondary", "secondary"],
                      ["muted", "muted"],
                      ["mutedForeground", "mutedForeground"],
                      ["border", "border"],
                    ] as const
                  ).map(([fieldKey, label]) => (
                    <ColorRow
                      key={fieldKey}
                      label={t(label)}
                      fieldKey={fieldKey}
                      theme={draft}
                      onChange={handleColor}
                    />
                  ))}
                </div>
              </ThemeSection>

              <ThemeSection title={t("typography")}>
                <div style={fieldStyle}>
                  <label htmlFor="theme-fontSans" style={labelStyle}>
                    {t("fontFamily")}
                  </label>
                  <input
                    id="theme-fontSans"
                    type="text"
                    value={draft.fontSans}
                    onChange={(event) =>
                      handleText("fontSans", event.target.value)
                    }
                    style={inputStyle}
                    placeholder="'Inter', sans-serif"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SliderRow
                    label={t("baseFontSize")}
                    fieldKey="fontSizeBase"
                    theme={draft}
                    onChange={handleNumber}
                    min={10}
                    max={20}
                    suffix="px"
                  />
                  <SliderRow
                    label={t("normalWeight")}
                    fieldKey="fontWeightNormal"
                    theme={draft}
                    onChange={handleNumber}
                    min={300}
                    max={500}
                  />
                  <SliderRow
                    label={t("boldWeight")}
                    fieldKey="fontWeightBold"
                    theme={draft}
                    onChange={handleNumber}
                    min={600}
                    max={900}
                  />
                </div>
              </ThemeSection>

              <ThemeSection title={t("borderRadius")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["radiusSm", "small", 16],
                      ["radiusMd", "medium", 24],
                      ["radiusLg", "large", 32],
                    ] as const
                  ).map(([fieldKey, label, max]) => (
                    <SliderRow
                      key={fieldKey}
                      label={t(label)}
                      fieldKey={fieldKey}
                      theme={draft}
                      onChange={handleNumber}
                      min={0}
                      max={max}
                      suffix="px"
                    />
                  ))}
                </div>
              </ThemeSection>

              <ThemeSection title={t("spacing")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["spacingSm", "small", 4, 24],
                      ["spacingMd", "medium", 8, 48],
                      ["spacingLg", "large", 16, 96],
                    ] as const
                  ).map(([fieldKey, label, min, max]) => (
                    <SliderRow
                      key={fieldKey}
                      label={t(label)}
                      fieldKey={fieldKey}
                      theme={draft}
                      onChange={handleNumber}
                      min={min}
                      max={max}
                      suffix="px"
                    />
                  ))}
                </div>
              </ThemeSection>

              <ThemeSection title={t("shadows")}>
                <div className="space-y-3">
                  {(
                    [
                      ["shadowSm", "small"],
                      ["shadowMd", "medium"],
                      ["shadowLg", "large"],
                    ] as const
                  ).map(([fieldKey, label]) => (
                    <div key={fieldKey} style={fieldStyle}>
                      <label htmlFor={`theme-${fieldKey}`} style={labelStyle}>
                        {t(label)} {t("shadows")}
                      </label>
                      <input
                        id={`theme-${fieldKey}`}
                        type="text"
                        value={draft[fieldKey]}
                        onChange={(event) =>
                          handleText(fieldKey, event.target.value)
                        }
                        style={inputStyle}
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              </ThemeSection>
            </div>
          </details>
        </div>

        <DialogFooter className="bg-muted/40 shrink-0 items-center justify-between border-t px-4 py-3 sm:px-6">
          <p className="text-muted-foreground w-full text-center text-xs sm:w-auto sm:text-start">
            {t("autoSaveHint")}
          </p>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDraft(DEFAULT_PAGE_THEME)}
            >
              <RotateCcw className="size-3.5" />
              {t("reset")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                <Check className="size-3.5" />
                {t("applyToPage")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
