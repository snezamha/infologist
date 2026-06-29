"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardFormField } from "@/components/dashboard/form-field";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/lib/toast-manager";
import {
  getProjectDomainId,
  getProjectDomainRoot,
} from "@/lib/projects/project/domain";
import {
  saveProjectDomain,
  removeProjectDomain,
  verifyProjectDomain,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[publicId]/settings/_actions/project-settings-actions";

type Props = {
  publicId: string;
  projectId: string;
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
  onUpdate: (domain: string | null, verified: Date | null) => void;
};

export function ProjectDomainCard({
  publicId,
  projectId,
  customDomain,
  customDomainVerifiedAt,
  onUpdate,
}: Props) {
  const t = useTranslations("projects");
  const [domain, setDomain] = useState(customDomain || "");
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);
  const domainRoot = getProjectDomainRoot();
  const domainId = getProjectDomainId(publicId);
  const expectedCname = `${domainId}.${domainRoot}`;

  function handleSave() {
    if (!domain.trim()) return;
    startTransition(async () => {
      try {
        const result = await saveProjectDomain(projectId, domain.trim());
        onUpdate(result.customDomain, result.customDomainVerifiedAt);
        toastManager.add({
          title: t("customDomain.saveSuccess"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: t("customDomain.saveError"),
          type: "error",
          timeout: 4000,
        });
      }
    });
  }

  function handleRemove() {
    if (!customDomain) return;
    startTransition(async () => {
      try {
        const result = await removeProjectDomain(projectId);
        setDomain("");
        onUpdate(result.customDomain, result.customDomainVerifiedAt);
        toastManager.add({
          title: t("customDomain.removeSuccess"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: t("customDomain.removeError"),
          type: "error",
          timeout: 4000,
        });
      }
    });
  }

  function handleVerify() {
    setIsVerifying(true);
    startTransition(async () => {
      try {
        const result = await verifyProjectDomain(projectId);
        onUpdate(
          result.project.customDomain,
          result.project.customDomainVerifiedAt,
        );
        if (result.result.verified) {
          toastManager.add({
            title: t("customDomain.verifySuccess"),
            type: "success",
            timeout: 3000,
          });
        } else {
          toastManager.add({
            title: result.result.error || t("customDomain.verifyError"),
            type: "error",
            timeout: 4000,
          });
        }
      } catch {
        toastManager.add({
          title: t("customDomain.verifyError"),
          type: "error",
          timeout: 4000,
        });
      } finally {
        setIsVerifying(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("customDomain.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("customDomain.description")}
        </p>
      </div>

      {customDomain && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("customDomain.currentDomain")}
              </p>
              <p className="font-mono text-sm" dir="ltr">
                {customDomain}
              </p>
            </div>
            <Badge variant={customDomainVerifiedAt ? "default" : "secondary"}>
              {customDomainVerifiedAt
                ? t("customDomain.verifiedBadge")
                : t("customDomain.unverifiedBadge")}
            </Badge>
          </div>
        </div>
      )}

      <DashboardFormField
        id="customDomain"
        label={t("customDomain.domainLabel")}
        description={t("customDomain.domainHint")}
      >
        <div className="flex gap-2">
          <Input
            id="customDomain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={t("customDomain.domainPlaceholder")}
            disabled={isPending}
          />
          <Button onClick={handleSave} disabled={isPending || !domain.trim()}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("customDomain.save")
            )}
          </Button>
        </div>
      </DashboardFormField>

      {customDomain && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t("customDomain.dnsInstructions")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("customDomain.dnsDescription")}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">
                      {t("customDomain.dnsType")}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t("customDomain.dnsName")}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t("customDomain.dnsValue")}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t("customDomain.dnsTTL")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2 font-mono">CNAME</td>
                    <td className="px-3 py-2 font-mono">@</td>
                    <td className="px-3 py-2 font-mono">{expectedCname}</td>
                    <td className="px-3 py-2">
                      {t("customDomain.dnsTTLAuto")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("customDomain.dnsHint")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={isVerifying || isPending}
              variant="outline"
            >
              {isVerifying ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" />
              )}
              {t("customDomain.verify")}
            </Button>
            <Button
              onClick={handleRemove}
              disabled={isPending}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              {isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                t("customDomain.remove")
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
