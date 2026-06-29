"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Crown, Shield, UserRound, Users } from "lucide-react";

import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";
import { getUserOverviewStats } from "@/app/[locale]/(dashboard)/dashboard/_actions/dashboard-actions";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["super_admin", "admin", "user"];

const ROLE_CONFIG: Record<
  Role,
  { icon: React.ElementType; bg: string; text: string; ring: string }
> = {
  super_admin: {
    icon: Crown,
    bg: "bg-violet-500/15",
    text: "text-violet-500",
    ring: "ring-violet-500/20",
  },
  admin: {
    icon: Shield,
    bg: "bg-sky-500/15",
    text: "text-sky-500",
    ring: "ring-sky-500/20",
  },
  user: {
    icon: UserRound,
    bg: "bg-emerald-500/15",
    text: "text-emerald-500",
    ring: "ring-emerald-500/20",
  },
};

type Stats = Awaited<ReturnType<typeof getUserOverviewStats>>;

export function UserOverviewWidget() {
  const t = useTranslations("dashboard");
  const { formatDateTime } = useSiteDateTimeFormat();
  const [stats, setStats] = useState<Stats>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getUserOverviewStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full p-4">
      {loading ? (
        <SiteSpinnerSection className="h-28 w-full" size={24} />
      ) : stats ? (
        <div className="space-y-4">
          <div className="from-primary/10 to-primary/5 flex items-center gap-3 rounded-xl bg-gradient-to-br p-3">
            <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-foreground text-2xl font-bold leading-none tabular-nums">
                {stats.total}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t("usersOverview.total")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((role) => {
              const count =
                stats.roleCounts.find((r) => r.role === role)?.count ?? 0;
              const { icon: Icon, bg, text, ring } = ROLE_CONFIG[role];
              return (
                <div
                  key={role}
                  className={`ring-1 ${ring} rounded-xl p-3 text-center`}
                >
                  <div
                    className={`${bg} ${text} mx-auto mb-2 flex size-8 items-center justify-center rounded-lg`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <p className="text-foreground text-lg font-bold leading-none tabular-nums">
                    {count}
                  </p>
                  <p className="text-muted-foreground mt-1 truncate text-[10px] leading-tight">
                    {t(`roles.${role}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <Clock className="size-3.5 shrink-0" />
            <span className="shrink-0">{t("usersOverview.lastLogin")}</span>
            <span className="text-foreground truncate font-medium">
              {stats.lastLoginAt
                ? formatDateTime(stats.lastLoginAt)
                : t("usersOverview.noLogin")}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
