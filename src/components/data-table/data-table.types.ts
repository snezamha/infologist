import type { Column, ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export interface DataTableBaseProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noDataMessage?: ReactNode;
  loading?: boolean;
  getExpandedRowContent?: (row: TData) => ReactNode;
}
