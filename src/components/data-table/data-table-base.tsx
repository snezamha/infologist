"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { DataTableColumnHeaderProps } from "./data-table.types";

import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableBaseProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noDataMessage?: ReactNode;
  loading?: boolean;
  getExpandedRowContent?: (row: TData) => ReactNode;
};

export function DataTableBase<TData, TValue>({
  columns,
  data,
  noDataMessage = "",
  loading,
  getExpandedRowContent,
}: DataTableBaseProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
    },
    state: {
      sorting,
    },
  });

  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;
  const virtualizeRows = hasRows && !getExpandedRowContent && rows.length > 40;
  const rowVirtualizer = useWindowVirtualizer({
    count: virtualizeRows ? rows.length : 0,
    estimateSize: () => 56,
    overscan: 8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const isLoading = loading ?? false;

  return (
    <div className="border-border bg-card relative overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table
          className={cn(
            "min-w-[800px] md:min-w-full",
            isLoading && "opacity-60",
          )}
        >
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={virtualizeRows ? "relative" : undefined}
            style={
              virtualizeRows
                ? { height: rowVirtualizer.getTotalSize() }
                : undefined
            }
          >
            {hasRows ? (
              virtualizeRows ? (
                virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]!;

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="absolute inset-x-0"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                rows.map((row) => {
                  const expandedContent = getExpandedRowContent?.(row.original);

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandedContent ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={row.getVisibleCells().length}
                            className="p-0"
                          >
                            {expandedContent}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-36 text-center text-sm"
                >
                  {noDataMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isLoading ? (
        <SiteSpinnerSection
          className="bg-background/60 absolute inset-0"
          size={24}
        />
      ) : null}
    </div>
  );
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  return (
    <button
      type="button"
      className={cn(
        "hover:text-foreground -mx-2 flex items-center gap-1 rounded-md px-2 py-0.5 text-start",
        className,
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "desc" ? (
        <ChevronDown className="size-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ChevronUp className="size-4" />
      ) : (
        <ChevronsUpDown className="size-4" />
      )}
    </button>
  );
}
