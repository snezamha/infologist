"use server";

import { requirePermission } from "@/lib/auth/rbac";
import {
  updateAppearanceSettings,
  type AppearanceSettings,
} from "@/lib/settings";

export async function saveAppearanceSettings(
  data: Partial<Omit<AppearanceSettings, "id">>,
) {
  await requirePermission("settings.manage");

  await updateAppearanceSettings(data);
}
