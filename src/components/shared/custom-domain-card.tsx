"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, CheckCircle, Clock, Copy, Loader2, X } from "lucide-react";

import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { DashboardFormField } from "@/components/dashboard/form-field";
import { AlignedBadge } from "@/components/ui/aligned-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/lib/toast-manager";
import {
  getProjectDomainId,
  getProjectDomainRoot,
} from "@/lib/projects/project/domain";
import type { DomainVerificationResult } from "@/lib/projects/project/custom-domain";

type Props = {
  publicId: string;
  initialCustomDomain: string | null;
  initialVerifiedAt: Date | null;
  onSave: (domain: string | null) => Promise<void>;
  onVerify: () => Promise<DomainVerificationResult>;
  onDomainChange?: (domain: string | null, verifiedAt: Date | null) => void;
};

export function CustomDomainCard({
  publicId,
  initialCustomDomain,
  initialVerifiedAt,
  onSave,
  onVerify,
  onDomainChange,
}: Props) {
  const t = useTranslations("projects");

  const cnameTarget = `${getProjectDomainId(publicId)}.${getProjectDomainRoot()}`;

  const [domain, setDomain] = useState(initialCustomDomain ?? "");
  const [savedDomain, setSavedDomain] = useState(initialCustomDomain ?? "");
  const [verifiedAt, setVerifiedAt] = useState(initialVerifiedAt);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [verifyDetails, setVerifyDetails] =
    useState<DomainVerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [isSaving, startSave] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [isVerifying, startVerify] = useTransition();

  const isDirty = domain.trim() !== savedDomain;
  const hasDomain = !!savedDomain;
  const isVerified = !!verifiedAt;

  function handleCopyTarget() {
    navigator.clipboard.writeText(cnameTarget).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleSave() {
    const trimmed = domain.trim();
    if (!trimmed) {
      setDomainError(t("customDomain.invalidDomain"));
      return;
    }
    setDomainError(null);
    setVerifyDetails(null);

    startSave(async () => {
      try {
        await onSave(trimmed);
        setSavedDomain(trimmed);
        setVerifiedAt(null);
        onDomainChange?.(trimmed, null);
        toastManager.add({
          title: t("customDomain.saveSuccess"),
          type: "success",
          timeout: 3000,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.message.includes("already in use")
            ? t("customDomain.conflictDomain")
            : t("customDomain.saveError");
        setDomainError(msg);
        toastManager.add({ title: msg, type: "error", timeout: 5000 });
      }
    });
  }

  function handleRemove() {
    setDomainError(null);
    setVerifyDetails(null);

    startRemove(async () => {
      try {
        await onSave(null);
        setDomain("");
        setSavedDomain("");
        setVerifiedAt(null);
        onDomainChange?.(null, null);
        toastManager.add({
          title: t("customDomain.removeSuccess"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: t("customDomain.removeError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  function handleVerify() {
    setVerifyDetails(null);

    startVerify(async () => {
      try {
        const result = await onVerify();
        setVerifyDetails(result);
        if (result.verified) {
          setVerifiedAt(new Date());
          onDomainChange?.(savedDomain, new Date());
          toastManager.add({
            title: t("customDomain.verifySuccess"),
            type: "success",
            timeout: 3000,
          });
        } else {
          toastManager.add({
            title: t("customDomain.verifyError"),
            type: "error",
            timeout: 5000,
          });
        }
      } catch {
        toastManager.add({
          title: t("customDomain.verifyError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <DashboardSectionCard
        title={t("customDomain.title")}
        description={t("customDomain.description")}
        contentClassName="space-y-4"
      >
        {hasDomain && (
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {isVerified ? (
                <CheckCircle className="size-4 shrink-0 text-green-500" />
              ) : (
                <Clock className="text-muted-foreground size-4 shrink-0" />
              )}
              <span className="font-mono text-sm truncate" dir="ltr">
                {savedDomain}
              </span>
              <AlignedBadge
                variant={isVerified ? "success" : "warning"}
                className="shrink-0"
              >
                {isVerified
                  ? t("customDomain.verifiedBadge")
                  : t("customDomain.unverifiedBadge")}
              </AlignedBadge>
            </div>
          </div>
        )}

        <DashboardFormField
          id="customDomain"
          label={t("customDomain.domainLabel")}
          description={t("customDomain.domainHint")}
        >
          <Input
            id="customDomain"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setDomainError(null);
            }}
            placeholder={t("customDomain.domainPlaceholder")}
            dir="ltr"
            aria-invalid={!!domainError}
          />
          {domainError && (
            <p className="text-destructive text-xs">{domainError}</p>
          )}
        </DashboardFormField>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !domain.trim()}
            size="sm"
          >
            {isSaving && <Loader2 className="me-1 size-4 animate-spin" />}
            {isSaving ? t("customDomain.saving") : t("customDomain.save")}
          </Button>

          {hasDomain && !isDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="me-1 size-4 animate-spin" />}
              {isVerifying
                ? t("customDomain.verifying")
                : t("customDomain.verify")}
            </Button>
          )}

          {hasDomain && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <Loader2 className="me-1 size-4 animate-spin" />
              ) : (
                <X className="me-1 size-4" />
              )}
              {isRemoving
                ? t("customDomain.removing")
                : t("customDomain.remove")}
            </Button>
          )}
        </div>

        {verifyDetails && (
          <div
            className={`rounded-md border px-3 py-2 text-sm space-y-1 ${
              verifyDetails.verified
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <p className="font-medium">
              {verifyDetails.verified
                ? t("customDomain.verifySuccess")
                : t("customDomain.verifyError")}
            </p>
            {!verifyDetails.verified && verifyDetails.error && (
              <p className="text-muted-foreground text-xs">
                {verifyDetails.error}
              </p>
            )}
            {verifyDetails.found.length > 0 && (
              <p className="font-mono text-xs" dir="ltr">
                {t("customDomain.verifyFound")}:{" "}
                {verifyDetails.found.join(", ")}
              </p>
            )}
            <p className="font-mono text-xs" dir="ltr">
              {t("customDomain.verifyExpected")}: {verifyDetails.target}
            </p>
          </div>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard
        title={t("customDomain.dnsInstructions")}
        description={t("customDomain.dnsDescription")}
        contentClassName="space-y-3"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground pb-2 pe-4 text-start font-medium">
                  {t("customDomain.dnsType")}
                </th>
                <th className="text-muted-foreground pb-2 pe-4 text-start font-medium">
                  {t("customDomain.dnsName")}
                </th>
                <th className="text-muted-foreground pb-2 pe-4 text-start font-medium">
                  {t("customDomain.dnsValue")}
                </th>
                <th className="text-muted-foreground pb-2 text-start font-medium">
                  {t("customDomain.dnsTTL")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pe-4 font-mono">CNAME</td>
                <td className="text-muted-foreground py-2 pe-4 font-mono">
                  {savedDomain || t("customDomain.domainPlaceholder")}
                </td>
                <td className="py-2 pe-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono" dir="ltr">
                      {cnameTarget}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTarget}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      aria-label="Copy"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-green-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="text-muted-foreground py-2 font-mono">
                  {t("customDomain.dnsTTLAuto")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("customDomain.dnsHint")}
        </p>
      </DashboardSectionCard>
    </div>
  );
}
