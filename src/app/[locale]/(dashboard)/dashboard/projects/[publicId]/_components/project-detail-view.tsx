"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toastManager } from "@/lib/toast-manager";
import type { ProjectRecord } from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import type { ProjectConfig } from "@/lib/projects/project/_config";
import { ProjectForm } from "@/app/[locale]/(dashboard)/dashboard/projects/_components/project-form";
import { ProjectStatusBadge } from "@/app/[locale]/(dashboard)/dashboard/projects/_components/project-status-badge";
import { ProjectAuthConfigCard } from "./project-auth-config-card";
import { ProjectDomainCard } from "./project-domain-card";
import { saveProjectAuthConfig } from "@/app/[locale]/(dashboard)/dashboard/projects/[publicId]/settings/_actions/project-settings-actions";
import { getProjectUrl } from "@/lib/projects/project/domain";
import {
  toProjectConfigForm,
  type ProjectConfigForm,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_lib/project-form-state";

type Props = {
  project: ProjectRecord;
  config: ProjectConfig;
};

export function ProjectDetailView({ project: initial, config }: Props) {
  const t = useTranslations("projects");
  const tSettings = useTranslations("settings");
  const [project, setProject] = useState(initial);
  const initialConfigForm = toProjectConfigForm(config);
  const [configForm, setConfigForm] =
    useState<ProjectConfigForm>(initialConfigForm);
  const [savedConfig, setSavedConfig] =
    useState<ProjectConfigForm>(initialConfigForm);
  const [configErrors, setConfigErrors] = useState<
    Partial<Record<keyof ProjectConfigForm, string>>
  >({});
  const [isPending, startTransition] = useTransition();
  const configDirty =
    JSON.stringify(configForm) !== JSON.stringify(savedConfig);
  const databaseConnected = Boolean(savedConfig.databaseUrl.trim());
  const authConnected = Boolean(
    savedConfig.clerkPublishableKey.trim() && savedConfig.clerkSecretKey.trim(),
  );
  const domainConfigured = Boolean(project.customDomain);
  const domainVerified = Boolean(project.customDomainVerifiedAt);
  const overviewItems = [
    {
      key: "status",
      label: t("overview.status"),
      value: t(`status.${project.status}`),
      tone: project.status === "active" ? "success" : "warning",
      icon: Server,
    },
    {
      key: "database",
      label: t("overview.database"),
      value: databaseConnected
        ? t("overview.connected")
        : t("overview.missing"),
      tone: databaseConnected ? "success" : "warning",
      icon: Database,
    },
    {
      key: "auth",
      label: t("overview.auth"),
      value: authConnected ? t("overview.connected") : t("overview.missing"),
      tone: authConnected ? "success" : "warning",
      icon: KeyRound,
    },
    {
      key: "domain",
      label: t("overview.domain"),
      value: domainConfigured
        ? domainVerified
          ? t("overview.verified")
          : t("overview.pending")
        : t("overview.defaultDomain"),
      tone: !domainConfigured || domainVerified ? "success" : "warning",
      icon: ShieldCheck,
    },
  ] as const;

  function setConfigKey<K extends keyof ProjectConfigForm>(
    key: K,
    value: string,
  ) {
    setConfigErrors((prev) => ({ ...prev, [key]: undefined }));
    setConfigForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateAuthConfig() {
    const nextErrors: Partial<Record<keyof ProjectConfigForm, string>> = {};
    setConfigErrors(nextErrors);
    return true;
  }

  function handleSaveAuth() {
    if (!validateAuthConfig()) return;
    startTransition(async () => {
      try {
        const nextConfig = {
          clerkPublishableKey: configForm.clerkPublishableKey.trim(),
          clerkSecretKey: configForm.clerkSecretKey.trim(),
          databaseUrl: configForm.databaseUrl.trim(),
        };
        const nonEmpty = Object.fromEntries(
          Object.entries({
            clerkPublishableKey: nextConfig.clerkPublishableKey,
            clerkSecretKey: nextConfig.clerkSecretKey,
            databaseUrl: nextConfig.databaseUrl,
          }).filter(([, v]) => v !== ""),
        ) as Partial<ProjectConfigForm>;
        const saved = await saveProjectAuthConfig(project.id, nonEmpty);
        const savedForm = {
          clerkPublishableKey: saved.clerkPublishableKey ?? "",
          clerkSecretKey: saved.clerkSecretKey ?? "",
          databaseUrl: saved.databaseUrl ?? "",
        };
        setConfigForm(savedForm);
        setSavedConfig(savedForm);
        toastManager.add({
          title: tSettings("saved"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: tSettings("error"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("title"), href: "/dashboard/projects" },
          { label: project.name },
        ]}
      />
      <DashboardPageHeader
        title={project.name}
        description={t("consoleDescription")}
        meta={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <span className="font-mono text-xs" dir="ltr">
              {project.publicId}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/dashboard/projects/${project.publicId}/features`}
                />
              }
            >
              {t("openFeatures")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={project.status !== "active"}
              nativeButton={false}
              render={
                <a
                  href={getProjectUrl(project.publicId)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink className="size-4" />
              {t("openSite")}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewItems.map((item) => {
          const Icon = item.icon;
          const showStatusMessage =
            item.key === "status" &&
            project.status === "suspended" &&
            project.statusMessage;
          return (
            <div key={item.key} className="rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <Icon className="text-muted-foreground size-4" />
              </div>
              <div className="mt-3">
                <Badge variant={item.tone}>{item.value}</Badge>
              </div>
              {showStatusMessage && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("statusMessageLabel")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.statusMessage}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t("tabs.info")}</TabsTrigger>
          <TabsTrigger value="auth">{t("tabs.auth")}</TabsTrigger>
          <TabsTrigger value="domain">{t("tabs.domain")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ProjectForm
            project={project}
            onSuccess={(updated) => {
              setProject(updated);
            }}
          />
        </TabsContent>

        <TabsContent value="auth">
          <div className="space-y-4">
            <ProjectAuthConfigCard
              form={configForm}
              errors={configErrors}
              set={setConfigKey}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveAuth}
                disabled={!configDirty || isPending}
              >
                {isPending && <Loader2 className="me-1 size-4 animate-spin" />}
                {t("saveSettings")}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="domain">
          <ProjectDomainCard
            publicId={project.publicId}
            projectId={project.id}
            customDomain={project.customDomain}
            customDomainVerifiedAt={project.customDomainVerifiedAt}
            onUpdate={(domain, verified) => {
              setProject((prev) => ({
                ...prev,
                customDomain: domain,
                customDomainVerifiedAt: verified,
              }));
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
