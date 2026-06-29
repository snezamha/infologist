"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { DataTableBaseProps } from "./data-table-base";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPageCount } from "@/lib/pagination";

import { DataTableBase } from "./data-table-base";
import { DataTableToolbar } from "./data-table-toolbar";

type ServerPaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export type ServerDataTableProps<TData, TValue> = DataTableBaseProps<
  TData,
  TValue
> & {
  loading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchable?: boolean;
  toolbarActions?: ReactNode;
  pagination: ServerPaginationConfig;
};

export function ServerDataTable<TData, TValue>({
  loading,
  searchValue,
  onSearchChange,
  searchPlaceholder = "",
  searchable = true,
  toolbarActions,
  pagination,
  ...tableProps
}: ServerDataTableProps<TData, TValue>) {
  const t = useTranslations("common");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [initialSearchValue] = useState(() => searchValue);
  const timeoutRef = useRef<number | null>(null);
  const lastDebouncedRef = useRef(initialSearchValue);

  useEffect(() => {
    if (
      searchInputRef.current &&
      searchInputRef.current.value !== searchValue &&
      lastDebouncedRef.current !== searchValue
    ) {
      searchInputRef.current.value = searchValue;
      lastDebouncedRef.current = searchValue;
    }
  }, [searchValue]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleSearchChange(value: string) {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      lastDebouncedRef.current = value;
      onSearchChange(value);
    }, 300);
  }

  const pageCount = getPageCount(pagination.total, pagination.pageSize);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchInput={
          searchable ? (
            <Input
              ref={searchInputRef}
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              defaultValue={initialSearchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full sm:max-w-sm"
            />
          ) : undefined
        }
        actions={toolbarActions}
      />

      <DataTableBase {...tableProps} loading={loading} />

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {t("table.total", { count: pagination.total })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || pagination.loading}
              aria-label={t("pagination.previous")}
              title={t("pagination.previous")}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <span className="text-muted-foreground px-2 text-sm">
              {pagination.page} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pageCount || pagination.loading}
              aria-label={t("pagination.next")}
              title={t("pagination.next")}
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
