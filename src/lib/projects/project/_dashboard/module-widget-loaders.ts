import type { ComponentType } from "react";

import { generatedProjectModuleWidgetLoaders } from "@/features/modules/_core/generated/module-widgets";

type WidgetModule = {
  default: ComponentType<Record<string, unknown>>;
};

export const MODULE_WIDGET_LOADERS: Record<
  string,
  () => Promise<WidgetModule>
> = generatedProjectModuleWidgetLoaders as unknown as Record<
  string,
  () => Promise<WidgetModule>
>;
