"use client";

import { useEffect } from "react";

import { ProjectFeaturesView } from "@/features/_core/_components/features-view";
import type { ProjectFeatures } from "@/features/_core/registry";
import type { ProjectModuleSummary } from "@/features/modules/_core/registry";
import { updateProjectFeatures } from "@/features/_core/_actions/features";
import {
  deleteProjectModuleGlobally,
  installProjectModule,
  uninstallProjectModuleAction,
} from "@/features/modules/_actions";
import { reinstallProjectModule } from "@/features/modules/_actions/reinstall-module";

type Props = {
  projectId?: string;
  projectPublicId?: string;
  projectSiteUrl?: string;
  projectHandoffUrl?: string;
  canManageProtectedSettings?: boolean;
  canDeleteModules?: boolean;
  initialFeatures: ProjectFeatures;
  initialModules: ProjectModuleSummary[];
};

export function AdminProjectFeaturesView({
  projectId,
  projectPublicId,
  projectSiteUrl,
  projectHandoffUrl,
  canManageProtectedSettings = false,
  canDeleteModules = false,
  initialFeatures,
  initialModules,
}: Props) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("modulesUpdated")) return;
    url.searchParams.delete("modulesUpdated");
    window.history.replaceState(null, "", url.toString());
  }, []);

  async function exportModule(key: string) {
    if (!projectId) {
      throw new Error("Project ID required");
    }

    const response = await fetch("/api/admin/modules/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, projectId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? "Failed to export module");
    }

    const contentDisposition =
      response.headers.get("Content-Disposition") ?? "";
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] ?? `${key}.zip`;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importModule(formData: FormData) {
    if (!projectId) {
      throw new Error("Project ID required");
    }

    formData.set("projectId", projectId);

    return fetch("/api/admin/modules/import", {
      method: "POST",
      body: formData,
    });
  }

  return (
    <ProjectFeaturesView
      initialFeatures={initialFeatures}
      initialModules={initialModules}
      projectSiteUrl={projectSiteUrl}
      projectHandoffUrl={projectHandoffUrl}
      editable={true}
      liveNavigationKey={projectPublicId}
      canManageProtectedSettings={canManageProtectedSettings}
      onImportModule={importModule}
      onExportModule={exportModule}
      onInstallModule={
        projectId ? (key) => installProjectModule(projectId, key) : undefined
      }
      onUninstallModule={
        projectId
          ? (key) => uninstallProjectModuleAction(projectId, key)
          : undefined
      }
      onReinstallModule={
        projectId ? (key) => reinstallProjectModule(projectId, key) : undefined
      }
      onDeleteModule={
        projectId && canDeleteModules
          ? (module) => deleteProjectModuleGlobally(module.key, projectId)
          : undefined
      }
      onSave={
        projectId
          ? (features) => updateProjectFeatures(projectId, features)
          : undefined
      }
    />
  );
}
