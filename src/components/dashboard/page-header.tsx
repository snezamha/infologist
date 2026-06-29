import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function DashboardPageHeader({
  title,
  description,
  meta,
  actions,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl leading-tight font-semibold sm:text-2xl">
          {title}
        </h1>
        {(description || meta) && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {description && <div>{description}</div>}
            {description && meta && <span aria-hidden="true">/</span>}
            {meta && <div>{meta}</div>}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
