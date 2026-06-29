"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, ExternalLink, Eye, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import type { PageStatus } from "@/features/page-builder/schemas";

import { DataTableColumnHeader } from "@/components/data-table/data-table";
import { ServerDataTable } from "@/components/data-table/server-data-table";
import { AlignedBadge } from "@/components/ui/aligned-badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalClose } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/lib/toast-manager";
import type { Locale } from "@/i18n/config";
import { buildProjectHref } from "@/lib/projects/project/site";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";
import { getLocalizedSlug } from "@/features/page-builder/locale-fields";
import { getPageRecordPublicHref } from "@/features/page-builder/public-pages";
import { deletePage } from "@/features/page-builder/actions";
import { pageStatuses } from "@/features/page-builder/page-editor-model";
import type { DashboardPage } from "@/features/page-builder/dashboard-types";

type Props = {
  domainId: string;
  pages: DashboardPage[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  status: PageStatus | "all";
  loading?: boolean;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: PageStatus | "all") => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
};

function statusBadgeVariant(status: PageStatus) {
  if (status === "published") return "success" as const;
  return "warning" as const;
}

function PageActions({
  domainId,
  content,
}: {
  domainId: string;
  content: DashboardPage;
}) {
  const t = useTranslations("pageBuilder");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          title={t("actions.edit")}
          render={
            <Link
              href={buildProjectHref(
                domainId,
                pathname,
                `/dashboard/page-builder/${content.id}/edit`,
              )}
            />
          }
        >
          <Edit className="size-4" />
        </Button>
        {content.status === "published" ? (
          <Button
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            title={t("actions.viewPublic")}
            render={
              <Link
                href={buildProjectHref(
                  domainId,
                  pathname,
                  getPageRecordPublicHref(content, locale),
                )}
                target="_blank"
              />
            }
          >
            <ExternalLink className="size-4" />
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          title={t("actions.previewDraft")}
          render={
            <Link
              href={buildProjectHref(
                domainId,
                pathname,
                `/dashboard/page-builder/${content.id}/preview?locale=${locale}`,
              )}
            />
          }
        >
          <Eye className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={t("actions.delete")}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="text-destructive size-4" />
        </Button>
      </div>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("actions.deleteConfirm")}
        description={t("actions.deleteConfirmDescription")}
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("actions.cancel")}</Button>}
            />
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deletePage(domainId, content.id);
                    setDeleteOpen(false);
                    toastManager.add({
                      title: t("deleteSuccess"),
                      type: "success",
                      timeout: 3000,
                    });
                  } catch {
                    toastManager.add({
                      title: t("error"),
                      type: "error",
                      timeout: 5000,
                    });
                  }
                })
              }
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("actions.confirm")}
            </Button>
          </>
        }
      />
    </>
  );
}

export function PageTable({
  domainId,
  pages,
  total,
  page,
  pageSize,
  query,
  status,
  loading,
  onSearchChange,
  onStatusChange,
  onReset,
  onPageChange,
}: Props) {
  const t = useTranslations("pageBuilder");
  const locale = useLocale() as Locale;
  const { formatDateTime } = useSiteDateTimeFormat();
  const hasFilters = Boolean(query || status !== "all");

  const columns: ColumnDef<DashboardPage>[] = [
    {
      accessorKey: "translations",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.title")} />
      ),
      cell: ({ row }) => {
        const content = row.original;
        const slug = getLocalizedSlug(content, locale);
        return (
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-sm font-medium">
                {content.translations[locale]?.title ||
                  content.translations.en.title}
              </p>
              {content.isHomepage ? (
                <AlignedBadge variant="secondary">
                  {t("table.homepage")}
                </AlignedBadge>
              ) : null}
            </div>
            <p className="text-muted-foreground truncate text-xs">{slug}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.status")} />
      ),
      cell: ({ row }) => (
        <AlignedBadge variant={statusBadgeVariant(row.original.status)}>
          {t(`status.${row.original.status}`)}
        </AlignedBadge>
      ),
    },
    {
      accessorKey: "authorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.author")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.authorName ?? t("unknownAuthor")}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("table.updated")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDateTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-end">{t("table.actions")}</div>,
      cell: ({ row }) => (
        <PageActions domainId={domainId} content={row.original} />
      ),
    },
  ];

  return (
    <ServerDataTable
      columns={columns}
      data={pages}
      loading={loading}
      noDataMessage={hasFilters ? t("emptyFiltered") : t("empty")}
      searchPlaceholder={t("filters.searchPlaceholder")}
      searchValue={query}
      onSearchChange={onSearchChange}
      toolbarActions={
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as PageStatus | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              {pageStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              {t("filters.reset")}
            </Button>
          ) : null}
        </div>
      }
      pagination={{
        page,
        pageSize,
        total,
        onPageChange,
      }}
    />
  );
}
