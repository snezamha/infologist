"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";

import { DataTableBase, type DataTableBaseProps } from "./data-table-base";
import { DataTableToolbar } from "./data-table-toolbar";

export type ClientDataTableProps<TData, TValue> = DataTableBaseProps<
  TData,
  TValue
> & {
  searchPlaceholder?: string;
  searchKeys?: (keyof TData)[];
  toolbarActions?: ReactNode;
};

export function ClientDataTable<TData, TValue>({
  data,
  searchPlaceholder,
  searchKeys,
  toolbarActions,
  ...tableProps
}: ClientDataTableProps<TData, TValue>) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((row) => {
      const fields = searchKeys
        ? searchKeys.map((k) => row[k])
        : Object.values(row as Record<string, unknown>);

      return fields.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [data, search, searchKeys]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchInput={
          searchPlaceholder !== undefined ? (
            <Input
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          ) : undefined
        }
        actions={toolbarActions}
      />
      <DataTableBase data={filtered} {...tableProps} />
    </div>
  );
}
