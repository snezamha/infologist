import type { ComponentType } from "react";

export const PROJECT_WIDGET_LOADERS: Record<
  string,
  () => Promise<{ default: ComponentType<Record<string, unknown>> }>
> = {
  "project:domain_status": async () => {
    const { DomainStatusWidget } =
      await import("./widgets/domain-status-widget");
    return { default: DomainStatusWidget };
  },
  "project:media_usage_rate": async () => {
    const { MediaUsageRateWidget } =
      await import("./widgets/media-usage-widget");
    return { default: MediaUsageRateWidget };
  },
  "project:statistics_analytics": async () => {
    const { StatisticsAnalyticsWidget } =
      await import("./widgets/statistics-analytics-widget");
    return { default: StatisticsAnalyticsWidget };
  },
};

export function getProjectWidgetIds(options?: {
  mediaEnabled?: boolean;
  statisticsEnabled?: boolean;
  moduleWidgetKeys?: string[];
}): string[] {
  return [
    "project:domain_status",
    ...(options?.mediaEnabled ? ["project:media_usage_rate"] : []),
    ...(options?.statisticsEnabled ? ["project:statistics_analytics"] : []),
    ...(options?.moduleWidgetKeys ?? []).map((key) => `module:${key}`),
  ];
}

export function getProjectWidgetDefaultLayout(options?: {
  mediaEnabled?: boolean;
  statisticsEnabled?: boolean;
  moduleWidgetKeys?: string[];
}): Array<{
  id: string;
  full: boolean;
  minimized: boolean;
}> {
  return [
    { id: "project:domain_status", full: false, minimized: false },
    ...(options?.mediaEnabled
      ? [{ id: "project:media_usage_rate", full: false, minimized: false }]
      : []),
    ...(options?.statisticsEnabled
      ? [{ id: "project:statistics_analytics", full: true, minimized: false }]
      : []),
    ...(options?.moduleWidgetKeys ?? []).map((key) => ({
      id: `module:${key}`,
      full: false,
      minimized: false,
    })),
  ];
}
