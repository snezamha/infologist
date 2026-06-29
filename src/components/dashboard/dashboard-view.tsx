"use client";

import type { DashboardLayout } from "@/lib/dashboard/layout";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { SortableDashboard } from "@/components/dashboard/sortable-dashboard";
import {
  useWidgetVisibility,
  WidgetVisibilityPanel,
} from "@/components/dashboard/widget-visibility-panel";

type Props = {
  title: string;
  description: string;
  activeWidgetIds: string[];
  widgetTitles: Record<string, string>;
  widgetProps?: Record<string, Record<string, unknown>>;
  dashboardLayoutStorageKey: string;
  defaultLayout: DashboardLayout;
  widgetLabels: {
    customize: string;
    empty: string;
    expand: string;
    collapse: string;
  };
  showEmptyState?: boolean;
};

export function DashboardView({
  title,
  description,
  activeWidgetIds,
  widgetTitles,
  widgetProps,
  dashboardLayoutStorageKey,
  defaultLayout,
  widgetLabels,
  showEmptyState = false,
}: Props) {
  const { hidden, toggle, visibleWidgetIds } = useWidgetVisibility(
    activeWidgetIds,
    dashboardLayoutStorageKey,
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={title}
        description={description}
        actions={
          activeWidgetIds.length > 0 ? (
            <WidgetVisibilityPanel
              allWidgetIds={activeWidgetIds}
              widgetTitles={widgetTitles}
              hidden={hidden}
              onToggle={toggle}
              customizeLabel={widgetLabels.customize}
            />
          ) : null
        }
      />

      {showEmptyState || visibleWidgetIds.length > 0 ? (
        <SortableDashboard
          activeWidgetIds={visibleWidgetIds}
          storageKey={dashboardLayoutStorageKey}
          widgetTitles={widgetTitles}
          widgetProps={widgetProps}
          defaultLayout={defaultLayout}
          emptyLabel={widgetLabels.empty}
          expandLabel={widgetLabels.expand}
          collapseLabel={widgetLabels.collapse}
        />
      ) : null}
    </div>
  );
}
