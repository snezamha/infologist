"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { Label } from "@/components/ui/label";
import {
  resolveLoadingColor,
  sanitizeLoadingColor,
  sanitizeLoadingSize,
  sanitizeLoadingSpinner,
} from "@/lib/site-settings/shared";
import { resolveThemePalette } from "@/lib/theme/presets";

import type { SettingsSectionProps } from "@/components/shared/settings-form";

export function AppearancePreview({
  form,
}: Pick<SettingsSectionProps, "form">) {
  const t = useTranslations("settings");
  const preset = resolveThemePalette(form.themeColor, form.themeCustomColor);
  const spinner =
    sanitizeLoadingSpinner(form.loadingSpinner) ?? "90-ring-with-bg";
  const loadingColorPreview =
    sanitizeLoadingColor(form.loadingColor) ?? "#2563eb";
  const loadingSizePreview = sanitizeLoadingSize(form.loadingSize) ?? 64;
  const previewColor = resolveLoadingColor(
    form.loadingColorMode,
    loadingColorPreview,
  );
  const style = {
    "--primary": preset.light.primary,
    "--primary-foreground": preset.light.primaryForeground,
    "--radius": `${form.themeRadius}rem`,
  } as CSSProperties;

  return (
    <div className="space-y-3">
      <Label>{t("appearance.preview")}</Label>
      <div className="bg-card ring-border rounded-xl p-4 ring-1" style={style}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-[var(--radius)] px-4 py-2 text-sm font-medium"
              style={{ borderRadius: `${form.themeRadius}rem` }}
            >
              {t("appearance.previewButton")}
            </button>
            <button
              type="button"
              className="border-border rounded-[var(--radius)] border px-4 py-2 text-sm"
              style={{ borderRadius: `${form.themeRadius}rem` }}
            >
              {t("appearance.previewButton")}
            </button>
            <div
              className="bg-primary size-8 rounded-full"
              style={{ backgroundColor: preset.swatch }}
            />
          </div>

          <div className="border-border flex items-center gap-3 border-t pt-4 sm:border-t-0 sm:border-s sm:pt-0 sm:ps-4">
            <div className="text-end">
              <p className="text-sm font-medium">
                {t(`appearance.loading.positions.${form.loadingPosition}`)}
              </p>
              <p className="text-muted-foreground text-xs">
                {loadingSizePreview}px
              </p>
            </div>
            <div
              className="grid size-12 shrink-0 place-items-center"
              style={{ color: previewColor }}
            >
              <LoadingSpinner
                spinner={spinner}
                colorMode={form.loadingColorMode}
                color={loadingColorPreview}
                size={Math.min(loadingSizePreview, 40)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
