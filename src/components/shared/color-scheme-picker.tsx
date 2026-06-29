"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  customThemeColorKey,
  hexToCss,
  normalizeThemeHex,
} from "@/lib/theme/custom-color";
import { colorPresets } from "@/lib/theme/presets";
import { cn } from "@/lib/utils";

import type { AppearanceSettings } from "@/lib/settings";

import type { SettingsSectionProps } from "@/components/shared/settings-form";

type PresetThemeColor = Exclude<
  AppearanceSettings["themeColor"],
  typeof customThemeColorKey
>;

export function ColorSchemePicker({ form, set }: SettingsSectionProps) {
  const t = useTranslations("settings");
  const customColor = hexToCss(form.themeCustomColor);
  const isCustom = form.themeColor === customThemeColorKey;

  function selectCustomColor(hex: string) {
    set("themeCustomColor", hex);
    set("themeColor", customThemeColorKey);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("appearance.colorScheme")}</Label>
        <p className="text-muted-foreground text-xs">
          {t("appearance.colorSchemeDescription")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(colorPresets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => set("themeColor", key as PresetThemeColor)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all",
              form.themeColor === key
                ? "border-primary"
                : "border-border hover:border-muted-foreground/50",
            )}
          >
            <span
              className="size-8 rounded-full shadow-sm"
              style={{ backgroundColor: preset.swatch }}
            />
            <span className="text-xs">{t(`appearance.colors.${key}`)}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => set("themeColor", customThemeColorKey)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all",
            isCustom
              ? "border-primary"
              : "border-border hover:border-muted-foreground/50",
          )}
        >
          <span
            className="size-8 rounded-full shadow-sm ring-1 ring-black/10"
            style={{
              backgroundColor: customColor,
              backgroundImage:
                "linear-gradient(135deg, transparent 45%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.12) 55%, transparent 55%)",
            }}
          />
          <span className="text-xs">{t("appearance.colors.custom")}</span>
        </button>
      </div>
      {isCustom ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="theme-custom-color">
              {t("appearance.customColor")}
            </Label>
            <input
              id="theme-custom-color"
              type="color"
              value={customColor}
              onChange={(event) => selectCustomColor(event.target.value)}
              className="border-input bg-background size-10 cursor-pointer rounded-lg border p-1"
              aria-label={t("appearance.customColor")}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label htmlFor="theme-custom-hex">
              {t("appearance.customColorHex")}
            </Label>
            <Input
              id="theme-custom-hex"
              value={form.themeCustomColor}
              onChange={(event) => {
                set("themeCustomColor", event.target.value);
                set("themeColor", customThemeColorKey);
              }}
              onBlur={(event) => {
                const normalized = normalizeThemeHex(event.target.value);

                if (normalized) {
                  selectCustomColor(normalized);
                }
              }}
              placeholder="#2563eb"
              dir="ltr"
              spellCheck={false}
              className="font-mono"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
