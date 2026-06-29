"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  getErrorMessage,
  localizeModuleActionError,
  localizeModuleImportError,
} from "@/features/_core/module-errors";
import type {
  ProjectModuleKey,
  ProjectModuleSummary,
} from "@/features/modules/_core/registry";
import { toastManager } from "@/lib/toast-manager";
import { publishProjectNavigationChange } from "@/hooks/use-live-project-navigation";

type ModuleOperation =
  | "install"
  | "uninstall"
  | "reinstall"
  | "delete"
  | "import"
  | "export";

type ModuleDeleteResult = ProjectModuleSummary[] | { deploymentId: string };

type UseModuleOperationsOptions = {
  liveNavigationKey?: string;
  onInstallModule?: (key: ProjectModuleKey) => Promise<ProjectModuleSummary[]>;
  onUninstallModule?: (
    key: ProjectModuleKey,
  ) => Promise<ProjectModuleSummary[]>;
  onReinstallModule?: (
    key: ProjectModuleKey,
  ) => Promise<ProjectModuleSummary[]>;
  onExportModule?: (key: ProjectModuleKey) => Promise<void>;
  onImportModule?: (formData: FormData) => Promise<Response>;
  onDeleteModule?: (
    module: ProjectModuleSummary,
  ) => Promise<ModuleDeleteResult>;
};

type ImportConflict = {
  file: File;
  existingVersion: string | null;
  newVersion: string;
  moduleKey: string;
  moduleTitle: Record<string, string>;
};

type UseModuleOperationsReturn = {
  modules: ProjectModuleSummary[];
  pendingModuleKeys: ProjectModuleKey[];
  moduleOperation: ModuleOperation | null;
  confirmDeleteModule: ProjectModuleSummary | null;
  confirmUninstallModule: ProjectModuleSummary | null;
  confirmImportConflict: ImportConflict | null;
  dependentWarning: ProjectModuleSummary[] | null;
  importInputRef: React.RefObject<HTMLInputElement>;
  handleInstallModule: (key: ProjectModuleKey) => void;
  handleUninstallModule: (key: ProjectModuleKey) => void;
  handleReinstallModule: (key: ProjectModuleKey) => void;
  handleExportModule: (key: ProjectModuleKey) => void;
  handleImportModule: (file: File | undefined) => void;
  handleConfirmImport: () => void;
  handleDeleteModule: (module: ProjectModuleSummary) => void;
  handleConfirmDeleteModule: () => void;
  handleConfirmUninstallModule: () => void;
  onCancelDeleteConfirm: () => void;
  onCancelUninstallConfirm: () => void;
  onCancelImportConflict: () => void;
};

function openModuleDeployment(deploymentId: string) {
  const url = new URL(
    "/api/admin/system/module-deployment",
    window.location.origin,
  );
  url.searchParams.set("id", deploymentId);
  url.searchParams.set("redirect", window.location.href);
  window.location.assign(url.toString());
}

export function useModuleOperations(
  initialModules: ProjectModuleSummary[],
  options: UseModuleOperationsOptions = {},
): UseModuleOperationsReturn {
  const t = useTranslations("settings");
  const importInputRef = useRef<HTMLInputElement>(null!);
  const [modules, setModules] = useState(initialModules);
  const [, startTransition] = useTransition();
  const [pendingModuleKeys, setPendingModuleKeys] = useState<
    ProjectModuleKey[]
  >([]);
  const [moduleOperation, setModuleOperation] =
    useState<ModuleOperation | null>(null);
  const [confirmDeleteModule, setConfirmDeleteModule] =
    useState<ProjectModuleSummary | null>(null);
  const [confirmUninstallModule, setConfirmUninstallModule] =
    useState<ProjectModuleSummary | null>(null);
  const [confirmImportConflict, setConfirmImportConflict] =
    useState<ImportConflict | null>(null);
  const [dependentWarning, setDependentWarning] = useState<
    ProjectModuleSummary[] | null
  >(null);

  function publishNavigationChange() {
    if (options.liveNavigationKey) {
      publishProjectNavigationChange(options.liveNavigationKey);
    }
  }

  function installModule(module: ProjectModuleSummary) {
    if (!options.onInstallModule) return;

    setPendingModuleKeys([module.key]);
    setModuleOperation("install");
    startTransition(async () => {
      try {
        const saved = await options.onInstallModule!(module.key);
        setModules(saved);
        publishNavigationChange();
        toastManager.add({
          title: t("features.modules.installed"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: localizeModuleActionError(
            getErrorMessage(error, t("features.modules.installFailed")),
            t,
          ),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingModuleKeys([]);
        setModuleOperation(null);
      }
    });
  }

  function handleInstallModule(key: ProjectModuleKey) {
    const selectedModule = modules.find((candidate) => candidate.key === key);
    if (selectedModule) installModule(selectedModule);
  }

  function handleUninstallModule(key: ProjectModuleKey) {
    const selectedModule = modules.find((candidate) => candidate.key === key);
    if (!selectedModule) return;

    setConfirmUninstallModule(selectedModule);
    const dependents = modules.filter(
      (module) =>
        module.active && module.dependencies.includes(selectedModule.key),
    );
    setDependentWarning(dependents.length > 0 ? dependents : null);
  }

  function handleConfirmUninstallModule() {
    if (!confirmUninstallModule || !options.onUninstallModule) return;

    const moduleToUninstall = confirmUninstallModule;
    setPendingModuleKeys([moduleToUninstall.key]);
    setModuleOperation("uninstall");
    setConfirmUninstallModule(null);
    startTransition(async () => {
      try {
        const saved = await options.onUninstallModule!(moduleToUninstall.key);
        setModules(saved);
        publishNavigationChange();
        toastManager.add({
          title: t("features.modules.uninstalled"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: localizeModuleActionError(
            getErrorMessage(error, t("features.modules.uninstallFailed")),
            t,
          ),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingModuleKeys([]);
        setModuleOperation(null);
      }
    });
  }

  function handleReinstallModule(key: ProjectModuleKey) {
    if (!options.onReinstallModule) return;

    setPendingModuleKeys([key]);
    setModuleOperation("reinstall");
    startTransition(async () => {
      try {
        const saved = await options.onReinstallModule!(key);
        setModules(saved);
        publishNavigationChange();
        toastManager.add({
          title: t("features.modules.installed"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: localizeModuleActionError(
            getErrorMessage(error, t("features.modules.installFailed")),
            t,
          ),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingModuleKeys([]);
        setModuleOperation(null);
      }
    });
  }

  function handleDeleteModule(module: ProjectModuleSummary) {
    if (!options.onDeleteModule) return;
    setConfirmDeleteModule(module);
  }

  function handleConfirmDeleteModule() {
    if (!confirmDeleteModule || !options.onDeleteModule) return;

    const moduleToDelete = confirmDeleteModule;
    setPendingModuleKeys([moduleToDelete.key]);
    setModuleOperation("delete");
    setConfirmDeleteModule(null);
    startTransition(async () => {
      try {
        const result = await options.onDeleteModule!(moduleToDelete);
        if (!Array.isArray(result)) {
          openModuleDeployment(result.deploymentId);
          return;
        }
        setModules(result);
        publishNavigationChange();
        toastManager.add({
          title: t("features.modules.deleted"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: localizeModuleActionError(
            getErrorMessage(error, t("features.modules.deleteFailed")),
            t,
          ),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingModuleKeys([]);
        setModuleOperation(null);
      }
    });
  }

  function handleExportModule(key: ProjectModuleKey) {
    if (!options.onExportModule) return;

    setPendingModuleKeys([key]);
    setModuleOperation("export");
    startTransition(async () => {
      try {
        await options.onExportModule!(key);
        toastManager.add({
          title: t("features.modules.exported"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: getErrorMessage(error, t("features.modules.exportFailed")),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingModuleKeys([]);
        setModuleOperation(null);
      }
    });
  }

  function handleImportModule(file: File | undefined) {
    if (!file || !options.onImportModule) return;

    const formData = new FormData();
    formData.set("file", file);
    setModuleOperation("import");
    startTransition(async () => {
      try {
        const response = await options.onImportModule!(formData);
        const data = (await response.json()) as {
          conflict?: boolean;
          existingVersion?: string | null;
          newVersion?: string;
          modules?: ProjectModuleSummary[];
          deploymentId?: string;
          error?: string;
        };

        if (response.status === 409 && data.conflict) {
          const moduleTitle = { en: file.name, fa: file.name, de: file.name };
          setConfirmImportConflict({
            file,
            existingVersion: data.existingVersion ?? null,
            newVersion: data.newVersion ?? "unknown",
            moduleKey: file.name,
            moduleTitle,
          });
          setModuleOperation(null);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Import failed");
        }

        if (data.deploymentId) {
          openModuleDeployment(data.deploymentId);
          return;
        }
        if (data.modules) {
          setModules(data.modules);
          publishNavigationChange();
          toastManager.add({
            title: t("features.modules.imported"),
            type: "success",
            timeout: 3000,
          });
        }
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          t("features.modules.importFailed"),
        );
        toastManager.add({
          title: localizeModuleImportError(errorMsg, t),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setModuleOperation(null);
        if (importInputRef.current) importInputRef.current.value = "";
      }
    });
  }

  function handleConfirmImport() {
    if (!confirmImportConflict || !options.onImportModule) return;

    const formData = new FormData();
    formData.set("file", confirmImportConflict.file);
    formData.set("overwrite", "true");
    setConfirmImportConflict(null);
    setModuleOperation("import");
    startTransition(async () => {
      try {
        const response = await options.onImportModule!(formData);
        const data = (await response.json()) as {
          modules?: ProjectModuleSummary[];
          deploymentId?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Import failed");
        }

        if (data.deploymentId) {
          openModuleDeployment(data.deploymentId);
          return;
        }
        if (data.modules) {
          setModules(data.modules);
          publishNavigationChange();
          toastManager.add({
            title: t("features.modules.imported"),
            type: "success",
            timeout: 3000,
          });
        }
      } catch (error) {
        const errorMsg = getErrorMessage(
          error,
          t("features.modules.importFailed"),
        );
        toastManager.add({
          title: localizeModuleImportError(errorMsg, t),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setModuleOperation(null);
      }
    });
  }

  return {
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
    onCancelDeleteConfirm: () => setConfirmDeleteModule(null),
    onCancelUninstallConfirm: () => {
      setConfirmUninstallModule(null);
      setDependentWarning(null);
    },
    onCancelImportConflict: () => setConfirmImportConflict(null),
  };
}
