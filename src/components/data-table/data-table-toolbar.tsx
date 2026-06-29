"use client";

import type { ReactNode } from "react";

type Props = {
  searchInput?: ReactNode;
  actions?: ReactNode;
};

export function DataTableToolbar({ searchInput, actions }: Props) {
  if (!searchInput && !actions) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {searchInput ?? <div />}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
