"use client";

import { useLocale, useTranslations } from "next-intl";
import { Blocks, Loader2, ToggleLeft, Upload } from "lucide-react";

import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { Button } from "@/components/ui/button";
import { Modal, ModalClose } from "@/components/ui/modal";
import { Separator } from "@/components/ui/separator";
import {
  projectFeatureRegistry,
  type ProjectFeatureKey,
  type ProjectFeatures,
} from "@/features/_core/registry";
import type {
  ProjectModuleKey,
  ProjectModuleSummary,
} from "@/features/modules/_core/registry";
import { useFeatureSave } from "@/features/_core/hooks/use-feature-save";
import { useModuleOperations } from "@/features/_core/hooks/use-module-operations";
import { FeaturesGrid } from "./features-grid";
import { ModulesGrid } from "./modules-grid";

type Props = {
  initialFeatures: ProjectFeatures;
  initialModules?: ProjectModuleSummary[];
  projectSiteUrl?: string;
  projectHandoffUrl?: string;
  editable?: boolean;
  canManageProtectedSettings?: boolean;
  emptyMessage?: string;
  onSave?: (features: Partial<ProjectFeatures>) => Promise<ProjectFeatures>;
  onUninstallModule?: (
    key: ProjectModuleKey,
  ) => Promise<ProjectModuleSummary[]>;
  onInstallModule?: (key: ProjectModuleKey) => Promise<ProjectModuleSummary[]>;
  onReinstallModule?: (
    key: ProjectModuleKey,
  ) => Promise<ProjectModuleSummary[]>;
  onImportModule?: (formData: FormData) => Promise<Response>;
  onExportModule?: (key: ProjectModuleKey) => Promise<void>;
  onDeleteModule?: (
    module: ProjectModuleSummary,
  ) => Promise<ProjectModuleSummary[] | { deploymentId: string }>;
  featureManagementLinks?: Partial<
    Record<ProjectFeatureKey, ReadonlyArray<{ href: string; label: string }>>
  >;
  liveNavigationKey?: string;
};

export function ProjectFeaturesView({
  initialFeatures,
  initialModules = [],
  projectSiteUrl,
  projectHandoffUrl,
  editable = true,
  canManageProtectedSettings = false,
  emptyMessage,
  onSave,
  onUninstallModule,
  onInstallModule,
  onReinstallModule,
  onImportModule,
  onExportModule,
  onDeleteModule,
  featureManagementLinks,
  liveNavigationKey,
}: Props) {
  const t = useTranslations("settings");
  const locale = useLocale();

  const featureSave = useFeatureSave(
    initialFeatures,
    onSave,
    editable,
    liveNavigationKey,
  );

  const {
    modules,
    pendingModuleKeys,
    moduleOperation,
    confirmDeleteModule,
    confirmUninstallModule,
    confirmImportConflict,
    dependentWarning,
    importInputRef,
    handleInstallModule,
    handleUninstallModule,
    handleReinstallModule,
    handleExportModule,
    handleImportModule,
    handleConfirmImport,
    handleDeleteModule,
    handleConfirmDeleteModule,
    handleConfirmUninstallModule,
    onCancelDeleteConfirm,
    onCancelUninstallConfirm,
    onCancelImportConflict,
  } = useModuleOperations(initialModules, {
    liveNavigationKey,
    onInstallModule,
    onUninstallModule,
    onReinstallModule,
    onExportModule,
    onImportModule,
    onDeleteModule,
  });
  const isModuleBusy = moduleOperation !== null;

  const visibleFeatures = projectFeatureRegistry.filter(
    (feature) => editable || featureSave.features[feature.key].enabled,
  );
  const visibleModules = editable
    ? modules
    : modules.filter((module) => module.active);

  const featureStates = Object.fromEntries(
    projectFeatureRegistry.map((feature) => [
      feature.key,
      {
        enabled: featureSave.features[feature.key]?.enabled ?? false,
        settings: featureSave.features[feature.key]?.settings ?? {},
      },
    ]),
  ) as Record<ProjectFeatureKey, { enabled: boolean; settings: unknown }>;

  return (
    <>
      {isModuleBusy ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[9999] bg-background/25 backdrop-blur-[1px]"
        >
          <SiteSpinnerSection className="h-full" size={24} />
        </div>
      ) : null}
      <div
        className="relative space-y-8"
        aria-busy={isModuleBusy ? "true" : undefined}
      >
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ToggleLeft className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                {t("features.system.title")}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {t("features.system.description")}
            </p>
          </div>
          {visibleFeatures.length > 0 ? (
            <FeaturesGrid
              features={visibleFeatures}
              featureStates={featureStates}
              onFeatureEnabledChange={featureSave.setFeatureEnabled}
              onSettingChange={featureSave.setFeatureSetting}
              editable={editable}
              disabled={isModuleBusy}
              canManageProtectedSettings={canManageProtectedSettings}
              managementLinks={featureManagementLinks}
            />
          ) : (
            <div className="rounded-lg border px-4 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage ?? t("features.empty")}
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Blocks className="size-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  {t("features.modules.title")}
                </h2>
              </div>
              <p className="text-muted-foreground">
                {t("features.modules.description")}
              </p>
            </div>
            {editable && (
              <div className="w-full sm:w-auto">
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(event) =>
                    handleImportModule(event.currentTarget.files?.[0])
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isModuleBusy}
                  onClick={() => importInputRef.current?.click()}
                >
                  {moduleOperation === "import" ? (
                    <Loader2 className="me-2 size-4 animate-spin" />
                  ) : (
                    <Upload className="me-2 size-4" />
                  )}
                  {t("features.modules.add")}
                </Button>
              </div>
            )}
          </div>

          {visibleModules.length > 0 ? (
            <ModulesGrid
              modules={visibleModules}
              locale={locale}
              projectSiteUrl={projectSiteUrl}
              projectHandoffUrl={projectHandoffUrl}
              onExportModule={handleExportModule}
              onUninstallModule={handleUninstallModule}
              onInstallModule={handleInstallModule}
              onReinstallModule={handleReinstallModule}
              onDeleteModule={onDeleteModule ? handleDeleteModule : undefined}
              pendingModuleKeys={pendingModuleKeys}
              moduleOperation={moduleOperation}
              editable={editable}
              disabled={isModuleBusy}
            />
          ) : (
            <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
              {t("features.modules.empty")}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={!!featureSave.confirmFeature}
        onOpenChange={(open) => {
          if (!open) featureSave.onCancelConfirm();
        }}
        title={t("features.disableConfirmTitle")}
        description={
          featureSave.confirmFeature
            ? t("features.disableConfirmDescription", {
                feature: t(
                  `features.items.${featureSave.confirmFeature.key}.title`,
                ),
              })
            : ""
        }
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              variant="destructive"
              disabled={isModuleBusy}
              onClick={featureSave.onConfirmDisable}
            >
              {t("features.disable")}
            </Button>
          </>
        }
      />

      <Modal
        open={!!confirmUninstallModule}
        onOpenChange={(open) => {
          if (!open) onCancelUninstallConfirm();
        }}
        title={t("features.modules.uninstallConfirmTitle", {
          name:
            confirmUninstallModule?.title[
              locale === "fa" || locale === "de" ? locale : "en"
            ] ?? "",
        })}
        description={
          <>
            <p>{t("features.modules.uninstallConfirmDescription")}</p>
            {dependentWarning && dependentWarning.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  {t("features.modules.cascadeWarning")}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {dependentWarning.map((module) => (
                    <li
                      key={module.key}
                      className="text-xs text-amber-800 dark:text-amber-300"
                    >
                      {
                        module.title[
                          locale === "fa" || locale === "de" ? locale : "en"
                        ]
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        }
        descriptionAsChild
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              variant="outline"
              disabled={isModuleBusy}
              onClick={handleConfirmUninstallModule}
            >
              {t("features.modules.deactivate")}
            </Button>
          </>
        }
      />

      <Modal
        open={!!confirmImportConflict}
        onOpenChange={(open) => {
          if (!open) onCancelImportConflict();
        }}
        title={t("features.modules.importConflictTitle")}
        description={
          confirmImportConflict
            ? t("features.modules.importConflictDescription", {
                name: confirmImportConflict.existingVersion
                  ? `${confirmImportConflict.moduleKey} (version ${confirmImportConflict.existingVersion})`
                  : confirmImportConflict.moduleKey,
                existingVersion: confirmImportConflict.existingVersion ?? "—",
                newVersion: confirmImportConflict.newVersion,
              })
            : ""
        }
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              variant="outline"
              disabled={isModuleBusy}
              onClick={handleConfirmImport}
            >
              {t("features.modules.importOverwrite")}
            </Button>
          </>
        }
      />

      <Modal
        open={!!confirmDeleteModule}
        onOpenChange={(open) => {
          if (!open) onCancelDeleteConfirm();
        }}
        title={t("features.modules.deleteConfirmTitle", {
          name:
            confirmDeleteModule?.title[
              locale === "fa" || locale === "de" ? locale : "en"
            ] ?? "",
        })}
        description={t("features.modules.deleteConfirmDescription")}
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              variant="destructive"
              disabled={isModuleBusy}
              onClick={handleConfirmDeleteModule}
            >
              {t("features.modules.delete")}
            </Button>
          </>
        }
      />
    </>
  );
}
