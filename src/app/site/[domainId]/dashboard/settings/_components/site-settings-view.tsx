"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/lib/toast-manager";
import { GeneralSettingsCard } from "@/components/shared/general-settings-card";
import { SeoSettingsCard } from "@/components/shared/seo-settings-card";
import { AppearanceSettingsCard } from "@/components/shared/appearance-settings-card";
import type {
  ProjectSettings,
  ProjectSettingsSetter,
} from "@/lib/projects/project/settings";
import type { AppearanceSettings } from "@/lib/settings";
import type { SettingsSetter } from "@/components/shared/settings-form";
import { saveSiteSettings } from "@/app/site/[domainId]/dashboard/settings/_actions/settings-actions";
import { SiteCustomDomainCard } from "./site-custom-domain-card";

const TABS = ["general", "seo", "appearance", "domain"] as const;
type Tab = (typeof TABS)[number];

type Props = {
  domainId: string;
  publicId: string;
  initialSettings: ProjectSettings;
  initialCustomDomain: string | null;
  initialCustomDomainVerifiedAt: Date | null;
};

export function SiteSettingsView({
  domainId,
  publicId,
  initialSettings,
  initialCustomDomain,
  initialCustomDomainVerifiedAt,
}: Props) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [form, setForm] = useState(initialSettings);
  const [savedForm, setSavedForm] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  function set<K extends keyof ProjectSettings>(
    key: K,
    value: ProjectSettings[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const { id, ...data } = form;
    void id;
    startTransition(async () => {
      try {
        await saveSiteSettings(domainId, data);
        setSavedForm(form);
        toastManager.add({ title: t("saved"), type: "success", timeout: 3000 });
      } catch {
        toastManager.add({ title: t("error"), type: "error", timeout: 5000 });
      }
    });
  }

  const showSaveButton = activeTab !== "domain";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b">
        <nav className="flex gap-1" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </nav>
        {showSaveButton && (
          <div className="mb-1">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isPending}
              size="sm"
            >
              {isPending && <Loader2 className="me-1 size-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        )}
      </div>

      <div hidden={activeTab !== "general"}>
        <GeneralSettingsCard form={form} set={set as ProjectSettingsSetter} />
      </div>
      <div hidden={activeTab !== "seo"}>
        <SeoSettingsCard form={form} set={set as ProjectSettingsSetter} />
      </div>
      <div hidden={activeTab !== "appearance"}>
        <AppearanceSettingsCard
          form={form as unknown as AppearanceSettings}
          set={set as unknown as SettingsSetter}
        />
      </div>
      <div hidden={activeTab !== "domain"}>
        <SiteCustomDomainCard
          domainId={domainId}
          publicId={publicId}
          initialCustomDomain={initialCustomDomain}
          initialVerifiedAt={initialCustomDomainVerifiedAt}
        />
      </div>
    </div>
  );
}
