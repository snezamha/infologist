"use client";

import type { PageStatus } from "@/features/page-builder/schemas";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { buildProjectHref } from "@/lib/projects/project/site";

import type { DashboardPage } from "@/features/page-builder/dashboard-types";
import { PageTable } from "@/features/page-builder/components/page-table";

type Props = {
  domainId: string;
  pages: DashboardPage[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  status: PageStatus | "all";
};

export function PageView({
  domainId,
  pages,
  total,
  page,
  pageSize,
  query,
  status,
}: Props) {
  const t = useTranslations("pageBuilder");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(
    next: Record<string, string | undefined>,
    options?: { replace?: boolean },
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      const search = params.toString();
      const target = search ? `${pathname}?${search}` : pathname;
      if (options?.replace) {
        router.replace(target);
      } else {
        router.push(target);
      }
    });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        meta={t("totalItems", { count: total })}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link
                href={buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/page-builder/new",
                )}
              />
            }
          >
            {t("actions.createPage")}
          </Button>
        }
      />

      <PageTable
        domainId={domainId}
        pages={pages}
        total={total}
        page={page}
        pageSize={pageSize}
        query={query}
        status={status}
        loading={isPending}
        onSearchChange={(nextQuery) =>
          updateParams(
            { q: nextQuery || undefined, page: undefined },
            { replace: true },
          )
        }
        onStatusChange={(nextStatus) =>
          updateParams({ status: nextStatus, page: undefined })
        }
        onReset={() =>
          updateParams({
            q: undefined,
            status: undefined,
            page: undefined,
          })
        }
        onPageChange={(nextPage) =>
          updateParams({ page: nextPage <= 1 ? undefined : String(nextPage) })
        }
      />
    </div>
  );
}
