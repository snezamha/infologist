"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProjectModuleSummary } from "@/features/modules/_core/registry";
import { cn } from "@/lib/utils";

type Props = {
  module: ProjectModuleSummary;
  locale: string;
  projectSiteUrl?: string;
  projectHandoffUrl?: string;
  onExport?: () => void;
  onUninstall?: () => void;
  onInstall?: () => void;
  onReinstall?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  editable?: boolean;
  disabled?: boolean;
  missingDependencies?: string[];
  moduleOperation?:
    | "install"
    | "export"
    | "uninstall"
    | "reinstall"
    | "delete"
    | "import"
    | null;
};

export function ModuleCard({
  module,
  locale,
  projectSiteUrl,
  projectHandoffUrl,
  onExport,
  onUninstall,
  onInstall,
  onReinstall,
  onDelete,
  isLoading = false,
  editable = true,
  disabled = false,
  missingDependencies = [],
  moduleOperation,
}: Props) {
  const t = useTranslations("settings");
  const moduleLocale = locale === "fa" || locale === "de" ? locale : "en";
  const isInstalled = Boolean(module.installedVersion);
  const hasMissingDependencies = missingDependencies.length > 0;
  const hasUpdate =
    Boolean(module.installedVersion) &&
    module.installedVersion !== module.version;
  const actionClassName = "h-auto min-h-0 rounded-none p-0 text-xs font-normal";
  const status = module.active
    ? hasUpdate
      ? "outdated"
      : "installed"
    : isInstalled
      ? "inactive"
      : "available";
  const isDisabled = disabled || isLoading;
  const openHref = projectHandoffUrl
    ? `${projectHandoffUrl}&${new URLSearchParams({
        callbackUrl: `/modules/${module.key}`,
      }).toString()}`
    : projectSiteUrl
      ? `${projectSiteUrl}modules/${module.key}`
      : null;

  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-x-3 gap-y-3 border-b px-4 py-4 transition-colors last:border-b-0 md:grid-cols-[minmax(12rem,0.8fr)_minmax(18rem,1.7fr)_8rem] md:gap-4",
        module.active && "bg-primary/[0.035]",
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">
            {module.title[moduleLocale]}
          </h3>
          {module.isPrivate ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {t("features.modules.private")}
            </span>
          ) : null}
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {module.active && openHref ? (
            <Button
              nativeButton={false}
              variant="link"
              className={actionClassName}
              disabled={isDisabled}
              render={<a href={openHref} target="_blank" rel="noreferrer" />}
            >
              {t("features.modules.open")}
              <ExternalLink className="ms-1 size-3" />
            </Button>
          ) : null}
          {editable && !module.active ? (
            <Button
              type="button"
              variant="link"
              className={actionClassName}
              disabled={isDisabled || hasMissingDependencies}
              onClick={onInstall}
            >
              {isInstalled
                ? t("features.modules.reactivate")
                : t("features.modules.install")}
            </Button>
          ) : null}
          {editable && module.active ? (
            <>
              <Button
                type="button"
                variant="link"
                className={actionClassName}
                disabled={isDisabled || moduleOperation === "reinstall"}
                onClick={onReinstall}
                title={
                  hasUpdate
                    ? t("features.modules.updateTooltip")
                    : t("features.modules.reinstallTooltip")
                }
              >
                {moduleOperation === "reinstall" && (
                  <Loader2 className="me-1 size-3 animate-spin" />
                )}
                {hasUpdate
                  ? t("features.modules.update")
                  : t("features.modules.reinstall")}
              </Button>
              <Button
                type="button"
                variant="link"
                className={actionClassName}
                disabled={isDisabled}
                onClick={onUninstall}
                title={t("features.modules.uninstallTooltip")}
              >
                {t("features.modules.uninstall")}
              </Button>
            </>
          ) : null}
          {onExport ? (
            <Button
              type="button"
              variant="link"
              className={actionClassName}
              disabled={isDisabled}
              onClick={onExport}
            >
              {t("features.modules.export")}
            </Button>
          ) : null}
          {editable && onDelete && !module.active ? (
            <Button
              type="button"
              variant="link"
              className={cn(
                actionClassName,
                "text-destructive hover:text-destructive",
              )}
              disabled={isDisabled}
              onClick={onDelete}
            >
              {t("features.modules.delete")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-6 text-muted-foreground">
          {module.description[moduleLocale]}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasUpdate ? (
            <>
              <span className="line-through opacity-50">
                {t("features.modules.version", {
                  version: module.installedVersion!,
                })}
              </span>
              <span className="mx-1">→</span>
              {t("features.modules.version", { version: module.version })}
            </>
          ) : (
            t("features.modules.version", { version: module.version })
          )}
          <span className="mx-1.5">·</span>
          <span dir="ltr" className="inline-block font-mono">
            {module.key}
          </span>
        </p>
        {hasMissingDependencies ? (
          <p className="text-xs text-destructive">
            {t("features.modules.missingDependencies", {
              deps: missingDependencies.join(", "),
            })}
          </p>
        ) : null}
      </div>

      <div className="self-start">
        <StatusBadge
          variant={
            module.active ? (hasUpdate ? "warning" : "success") : "outline"
          }
        >
          {t(`features.modules.status.${status}`)}
        </StatusBadge>
      </div>
    </article>
  );
}
