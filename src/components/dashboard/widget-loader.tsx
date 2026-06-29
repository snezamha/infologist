"use client";

import React from "react";

import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { CORE_WIDGET_LOADERS } from "@/lib/dashboard/core-widgets";
import { PROJECT_WIDGET_LOADERS } from "@/lib/projects/project/_dashboard/core-widgets";
import { MODULE_WIDGET_LOADERS } from "@/lib/projects/project/_dashboard/module-widget-loaders";

const WIDGET_LOADERS = {
  ...CORE_WIDGET_LOADERS,
  ...PROJECT_WIDGET_LOADERS,
  ...MODULE_WIDGET_LOADERS,
};

function WidgetLoadError({ widgetKey }: { widgetKey: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
      {widgetKey}
    </div>
  );
}

export function WidgetLoader({
  moduleId,
  widgetId,
  widgetProps,
}: {
  moduleId: string;
  widgetId: string;
  widgetProps?: Record<string, unknown>;
}) {
  const widgetKey = `${moduleId}:${widgetId}`;
  const loader = WIDGET_LOADERS[widgetKey];
  const [loaded, setLoaded] = React.useState<{
    key: string;
    Component: React.ComponentType<Record<string, unknown>>;
  } | null>(null);

  React.useEffect(() => {
    if (!loader) return;

    let active = true;

    void (
      loader as () => Promise<{
        default: React.ComponentType<Record<string, unknown>>;
      }>
    )()
      .then((mod) => {
        if (active) setLoaded({ key: widgetKey, Component: mod.default });
      })
      .catch(() => {
        const ErrorWidget = () => <WidgetLoadError widgetKey={widgetKey} />;
        if (active) setLoaded({ key: widgetKey, Component: ErrorWidget });
      });

    return () => {
      active = false;
    };
  }, [loader, widgetKey]);

  if (!loader) return <WidgetLoadError widgetKey={widgetKey} />;

  if (!loaded || loaded.key !== widgetKey) {
    return <SiteSpinnerSection className="w-full p-12" size={24} />;
  }

  const Widget = loaded.Component;

  return <Widget {...(widgetProps ?? {})} />;
}
