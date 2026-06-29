"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-lg", className)} />;
}

export function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-56 max-w-full" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-32 sm:h-40" />
        <SkeletonBlock className="h-32 sm:h-40" />
        <SkeletonBlock className="h-32 sm:h-40" />
        <SkeletonBlock className="h-32 sm:h-40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>

      <SkeletonBlock className="h-80" />
    </div>
  );
}

type DashboardErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function DashboardErrorState({
  error,
  reset,
}: DashboardErrorStateProps) {
  const t = useTranslations("common.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="bg-card ring-border w-full max-w-lg space-y-6 rounded-xl p-8 text-center ring-1">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            {t("retry")}
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/dashboard" />}
          >
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
}
