"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import type { ProjectModuleSummary } from "@/features/modules/_core/registry";
import { ModuleCard } from "./module-card";

type ModuleFilter = "all" | "active" | "inactive" | "available";

function getMissingDependencies(
  module: ProjectModuleSummary,
  activeKeys: Set<string>,
): string[] {
  if (module.active || !module.dependencies.length) return [];
  return module.dependencies.filter(
    (dependency) => !activeKeys.has(dependency),
  );
}

function matchesFilter(module: ProjectModuleSummary, filter: ModuleFilter) {
  if (filter === "active") return module.active;
  if (filter === "inactive") return !module.active && !!module.installedVersion;
  if (filter === "available") return !module.installedVersion;
  return true;
}

type Props = {
  modules: ProjectModuleSummary[];
  locale: string;
  projectSiteUrl?: string;
  projectHandoffUrl?: string;
  onExportModule?: (key: string) => void;
  onUninstallModule?: (key: string) => void;
  onInstallModule?: (key: string) => void;
  onReinstallModule?: (key: string) => void;
  onDeleteModule?: (module: ProjectModuleSummary) => void;
  pendingModuleKeys?: string[];
  moduleOperation?:
    | "install"
    | "export"
    | "uninstall"
    | "reinstall"
    | "delete"
    | "import"
    | null;
  editable?: boolean;
  disabled?: boolean;
};

export function ModulesGrid({
  modules,
  locale,
  projectSiteUrl,
  projectHandoffUrl,
  onExportModule,
  onUninstallModule,
  onInstallModule,
  onReinstallModule,
  onDeleteModule,
  pendingModuleKeys = [],
  moduleOperation,
  editable = true,
  disabled = false,
}: Props) {
  const t = useTranslations("settings");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ModuleFilter>("all");
  const moduleLocale = locale === "fa" || locale === "de" ? locale : "en";
  const pendingKeys = useMemo(
    () => new Set(pendingModuleKeys),
    [pendingModuleKeys],
  );
  const activeKeys = useMemo(
    () =>
      new Set(
        modules.filter((module) => module.active).map((module) => module.key),
      ),
    [modules],
  );
  const counts = useMemo(
    () => ({
      all: modules.length,
      active: modules.filter((module) => module.active).length,
      inactive: modules.filter(
        (module) => !module.active && !!module.installedVersion,
      ).length,
      available: modules.filter((module) => !module.installedVersion).length,
    }),
    [modules],
  );
  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase(locale);
    return modules.filter((module) => {
      if (!matchesFilter(module, filter)) return false;
      if (!query) return true;
      return [
        module.key,
        module.title[moduleLocale],
        module.description[moduleLocale],
      ].some((value) => value.toLocaleLowerCase(locale).includes(query));
    });
  }, [filter, locale, moduleLocale, modules, searchTerm]);
  const isBusy = disabled || moduleOperation !== null;

  const filterItems: ModuleFilter[] = [
    "all",
    "active",
    "inactive",
    "available",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-x-1 gap-y-2"
          role="tablist"
        >
          {filterItems.map((item, index) => (
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
                disabled={isBusy}
                onClick={() => setFilter(item)}
              >
                {t(`features.modules.filters.${item}`)}
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
            placeholder={t("features.modules.searchPlaceholder")}
            value={searchTerm}
            disabled={isBusy}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {editable && filteredModules.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("features.modules.itemCount", { count: filteredModules.length })}
        </p>
      ) : null}

      {filteredModules.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden min-h-11 grid-cols-[minmax(12rem,0.8fr)_minmax(18rem,1.7fr)_8rem] items-center gap-4 border-b bg-muted/40 px-4 text-xs font-medium text-muted-foreground md:grid">
            <span>{t("features.modules.columns.module")}</span>
            <span>{t("features.modules.columns.description")}</span>
            <span>{t("features.modules.columns.status")}</span>
          </div>
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.key}
              module={module}
              locale={locale}
              projectSiteUrl={projectSiteUrl}
              projectHandoffUrl={projectHandoffUrl}
              onExport={
                onExportModule ? () => onExportModule(module.key) : undefined
              }
              onUninstall={() => onUninstallModule?.(module.key)}
              onInstall={() => onInstallModule?.(module.key)}
              onReinstall={() => onReinstallModule?.(module.key)}
              onDelete={() => onDeleteModule?.(module)}
              isLoading={pendingKeys.has(module.key)}
              missingDependencies={getMissingDependencies(module, activeKeys)}
              editable={editable}
              disabled={isBusy}
              moduleOperation={moduleOperation}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? t("features.modules.noSearchResults", { query: searchTerm })
              : t("features.modules.emptyFilter")}
          </p>
        </div>
      )}
    </div>
  );
}
