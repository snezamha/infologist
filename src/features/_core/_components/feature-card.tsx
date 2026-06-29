"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ProjectFeatureDefinition,
  ProjectFeatureSettings,
} from "@/features/_core/registry";
import { Link } from "@/i18n/navigation";

type Props = {
  feature: ProjectFeatureDefinition;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  settings?: ProjectFeatureSettings;
  onSettingChange?: (key: string, value: unknown) => void;
  editable?: boolean;
  disabled?: boolean;
  canManageProtectedSettings?: boolean;
  managementLinks?: ReadonlyArray<{ href: string; label: string }>;
};

export function FeatureCard({
  feature,
  enabled,
  onEnabledChange,
  settings,
  onSettingChange,
  editable = true,
  disabled = false,
  canManageProtectedSettings = false,
  managementLinks = [],
}: Props) {
  const t = useTranslations("settings");
  const [isExpanded, setIsExpanded] = useState(false);
  const featureKey = feature.key;
  const hasSettings = feature.settingsFields.length > 0;
  const hasActions =
    (enabled && managementLinks.length > 0) || (hasSettings && editable);
  const title = t(`features.items.${featureKey}.title`);
  const actionClassName = "h-auto min-h-0 rounded-none p-0 text-xs font-normal";

  return (
    <article className="border-b last:border-b-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-muted/20 md:grid-cols-[minmax(12rem,0.8fr)_minmax(18rem,1.7fr)_9rem] md:items-start">
        <div className="min-w-0 space-y-2">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {hasActions ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {enabled
                ? managementLinks.map((link) => (
                    <Button
                      key={link.href}
                      variant="link"
                      className={actionClassName}
                      nativeButton={false}
                      disabled={disabled}
                      render={<Link href={link.href} />}
                    >
                      {link.label}
                    </Button>
                  ))
                : null}
              {hasSettings && editable ? (
                <Button
                  type="button"
                  variant="link"
                  className={actionClassName}
                  aria-expanded={isExpanded}
                  disabled={disabled}
                  onClick={() => setIsExpanded((current) => !current)}
                >
                  {t("features.settingsToggle")}
                  <ChevronDown
                    className={`ms-1 size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="col-span-2 text-sm leading-6 text-muted-foreground md:col-span-1">
          {t(`features.items.${featureKey}.description`)}
        </p>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 md:col-start-auto md:row-start-auto md:justify-start">
          <StatusBadge variant={enabled ? "success" : "outline"}>
            {enabled ? t("active") : t("inactive")}
          </StatusBadge>
          {editable ? (
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              disabled={disabled}
              aria-label={t(`features.items.${featureKey}.toggle`)}
            />
          ) : null}
        </div>
      </div>

      {isExpanded && hasSettings && editable ? (
        <div className="space-y-3 border-t bg-muted/20 px-4 py-4">
          {feature.settingsFields.map((field) => {
            const storedValue = (
              settings as Record<string, unknown> | undefined
            )?.[field.key];
            if (typeof storedValue !== "number") return null;
            const translationKey = `features.settings.${featureKey}.${field.key}`;
            const isProtectedStorageSetting =
              featureKey === "mediaManagement" &&
              field.key === "maxTotalStorageGB";
            if (isProtectedStorageSetting && !canManageProtectedSettings) {
              return null;
            }

            return (
              <SettingsField
                key={field.key}
                label={t(`${translationKey}.label`)}
                description={t(`${translationKey}.description`)}
                badge={isProtectedStorageSetting ? t("protectedBadge") : null}
                unit={t(`${translationKey}.unit`)}
                value={Math.round(storedValue / field.storageScale)}
                onChange={(value) =>
                  onSettingChange?.(field.key, value * field.storageScale)
                }
                disabled={disabled}
                min={field.min}
                max={field.max}
              />
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function SettingsField({
  label,
  description,
  badge,
  unit,
  value,
  onChange,
  disabled = false,
  min,
  max,
}: {
  label: string;
  description: string;
  badge?: string | null;
  unit: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  min: number;
  max: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="block text-sm font-medium">{label}</span>
          {badge ? (
            <Badge variant="outline" className="text-[11px]">
              {badge}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = Number.parseInt(event.target.value, 10);
            if (nextValue >= min && nextValue <= max) onChange(nextValue);
          }}
          className="w-24 text-end"
          dir="ltr"
        />
        <span className="shrink-0 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
