import {
  CheckCircle2,
  Clock3,
  Globe2,
  Link2,
  ShieldCheck,
  Signal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DomainStatusCopy = {
  eyebrow: string;
  currentTemporary: string;
  currentCustom: string;
  projectActive: string;
  projectInactive: string;
  temporaryTitle: string;
  temporaryDescription: string;
  customTitle: string;
  customEmpty: string;
  customVerified: string;
  customPending: string;
  active: string;
  inactive: string;
  pending: string;
  current: string;
};

type DomainStatusWidgetProps = {
  projectName: string;
  projectStatus: string;
  currentDomainType: "temporary" | "custom";
  temporaryDomain: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  copy: DomainStatusCopy;
};

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        active ? "bg-emerald-500" : "bg-muted-foreground/40",
      )}
    />
  );
}

function DomainLine({
  icon,
  title,
  description,
  domain,
  active,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  domain: string;
  active: boolean;
  badge: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot active={active} />
                <p className="truncate text-sm font-medium">{title}</p>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {description}
              </p>
            </div>
            <div className="shrink-0">{badge}</div>
          </div>
          <p
            className="text-muted-foreground truncate font-mono text-xs"
            dir="ltr"
          >
            {domain}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DomainStatusWidget(props: Record<string, unknown>) {
  const {
    projectName,
    projectStatus,
    currentDomainType,
    temporaryDomain,
    customDomain,
    customDomainVerified,
    copy,
  } = props as DomainStatusWidgetProps;
  const projectActive = projectStatus === "active";
  const temporaryActive = projectActive;
  const customActive = projectActive && !!customDomain && customDomainVerified;
  const currentIsCustom = currentDomainType === "custom";
  const statusLabel = projectActive ? copy.projectActive : copy.projectInactive;
  const currentLabel = currentIsCustom
    ? copy.currentCustom
    : copy.currentTemporary;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs">{copy.eyebrow}</p>
          <h3 className="truncate text-base font-semibold">{projectName}</h3>
        </div>
        <Badge variant={projectActive ? "success" : "warning"}>
          <Signal className="me-1 size-3" />
          {statusLabel}
        </Badge>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          {currentIsCustom ? (
            <ShieldCheck className="size-4 text-emerald-500" />
          ) : (
            <Globe2 className="size-4 text-sky-500" />
          )}
          <p className="text-sm font-medium">{currentLabel}</p>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{copy.current}</p>
      </div>

      <div className="space-y-3">
        <DomainLine
          icon={<Globe2 className="size-4" />}
          title={copy.temporaryTitle}
          description={copy.temporaryDescription}
          domain={temporaryDomain}
          active={temporaryActive}
          badge={
            <Badge variant={temporaryActive ? "success" : "warning"}>
              {temporaryActive ? copy.active : copy.inactive}
            </Badge>
          }
        />

        <DomainLine
          icon={<Link2 className="size-4" />}
          title={copy.customTitle}
          description={
            customDomain
              ? customDomainVerified
                ? copy.customVerified
                : copy.customPending
              : copy.customEmpty
          }
          domain={customDomain ?? "—"}
          active={customActive}
          badge={
            <Badge
              variant={
                customActive ? "success" : customDomain ? "warning" : "outline"
              }
            >
              {customActive ? (
                <CheckCircle2 className="me-1 size-3" />
              ) : customDomain ? (
                <Clock3 className="me-1 size-3" />
              ) : null}
              {customActive
                ? copy.active
                : customDomain
                  ? copy.pending
                  : copy.inactive}
            </Badge>
          }
        />
      </div>
    </div>
  );
}

export default DomainStatusWidget;
