"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import type {
  ProjectFeatureDefinition,
  ProjectFeatureKey,
} from "@/features/_core/registry";
import { FeatureCard } from "./feature-card";

type FeatureFilter = "all" | "active" | "inactive";

const featureFilters: FeatureFilter[] = ["all", "active", "inactive"];

type Props = {
  features: readonly ProjectFeatureDefinition[];
  featureStates: Record<
    ProjectFeatureKey,
    { enabled: boolean; settings: unknown }
  >;
  onFeatureEnabledChange: (key: ProjectFeatureKey, enabled: boolean) => void;
  onSettingChange?: (
    key: ProjectFeatureKey,
    setting: string,
    value: unknown,
  ) => void;
  editable?: boolean;
  disabled?: boolean;
  canManageProtectedSettings?: boolean;
  managementLinks?: Partial<
    Record<ProjectFeatureKey, ReadonlyArray<{ href: string; label: string }>>
  >;
};

export function FeaturesGrid({
  features,
  featureStates,
  onFeatureEnabledChange,
  onSettingChange,
  editable = true,
  disabled = false,
  canManageProtectedSettings = false,
  managementLinks,
}: Props) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");
  const counts = useMemo(
    () => ({
      all: features.length,
      active: features.filter((feature) => featureStates[feature.key].enabled)
        .length,
      inactive: features.filter(
        (feature) => !featureStates[feature.key].enabled,
      ).length,
    }),
    [featureStates, features],
  );
  const filteredFeatures = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase(locale);

    return features.filter((feature) => {
      const enabled = featureStates[feature.key].enabled;
      if (filter === "active" && !enabled) return false;
      if (filter === "inactive" && enabled) return false;
      if (!query) return true;

      const title = t(`features.items.${feature.key}.title`);
      const description = t(`features.items.${feature.key}.description`);
      return [feature.key, title, description].some((value) =>
        value.toLocaleLowerCase(locale).includes(query),
      );
    });
  }, [featureStates, features, filter, locale, searchTerm, t]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-x-1 gap-y-2"
          role="tablist"
        >
          {featureFilters.map((item, index) => (
            <div key={item} className="flex items-center gap-1">
              {index > 0 ? <span className="text-border">|</span> : null}
              <button
                type="button"
                role="tab"
                aria-selected={filter === item}
                className={
                  filter === item
                    ? "px-1 text-sm font-semibold text-foreground"
                    : "px-1 text-sm text-primary hover:underline"
                }
                disabled={disabled}
                onClick={() => setFilter(item)}
              >
                {t(`features.filters.${item}`)}
                <span className="ms-1 text-muted-foreground">
                  ({counts[item]})
                </span>
              </button>
            </div>
          ))}
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("features.searchPlaceholder")}
            value={searchTerm}
            disabled={disabled}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("features.itemCount", { count: filteredFeatures.length })}
      </p>

      {filteredFeatures.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden min-h-11 grid-cols-[minmax(12rem,0.8fr)_minmax(18rem,1.7fr)_9rem] items-center gap-4 border-b bg-muted/40 px-4 text-xs font-medium text-muted-foreground md:grid">
            <span>{t("features.columns.feature")}</span>
            <span>{t("features.columns.description")}</span>
            <span>{t("features.columns.status")}</span>
          </div>
          {filteredFeatures.map((feature) => {
            const state = featureStates[feature.key];
            return (
              <FeatureCard
                key={feature.key}
                feature={feature}
                enabled={state.enabled}
                onEnabledChange={(enabled) =>
                  onFeatureEnabledChange(feature.key, enabled)
                }
                settings={state.settings as never}
                onSettingChange={(setting, value) =>
                  onSettingChange?.(feature.key, setting, value)
                }
                editable={editable}
                disabled={disabled}
                canManageProtectedSettings={canManageProtectedSettings}
                managementLinks={managementLinks?.[feature.key]}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? t("features.noSearchResults", { query: searchTerm })
              : t("features.emptyFilter")}
          </p>
        </div>
      )}
    </div>
  );
}
