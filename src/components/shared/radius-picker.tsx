"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { radiusPresets } from "@/lib/theme/presets";
import { cn } from "@/lib/utils";

import type { SettingsSectionProps } from "@/components/shared/settings-form";

export function RadiusPicker({ form, set }: SettingsSectionProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-3">
      <div>
        <Label>{t("appearance.borderRadius")}</Label>
        <p className="text-muted-foreground text-xs">
          {t("appearance.borderRadiusDescription")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {radiusPresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => set("themeRadius", preset.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
              form.themeRadius === preset.value
                ? "border-primary"
                : "border-border hover:border-muted-foreground/50",
            )}
          >
            <div
              className="bg-muted border-primary size-10 border-2"
              style={{ borderRadius: `${preset.value}rem` }}
            />
            <span className="text-xs">
              {t(`appearance.radius.${preset.label}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
