import { z } from "zod";

const DashboardLayoutItemSchema = z.object({
  id: z.string(),
  full: z.boolean(),
  minimized: z.boolean().default(false),
});

const DashboardLayoutSchema = z
  .union([
    z.object({
      items: z.array(DashboardLayoutItemSchema),
      hidden: z.array(z.string()).default([]),
    }),
    z.record(z.string(), z.array(z.string())),
    z.array(z.string()),
  ])
  .default([]);

export type DashboardLayoutItem = z.infer<typeof DashboardLayoutItemSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;

export function parseDashboardLayout(value: unknown): DashboardLayout {
  return DashboardLayoutSchema.parse(value ?? []);
}
