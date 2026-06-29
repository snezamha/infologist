import type { AppearanceSettings } from "@/lib/settings";

export type SettingsSetter = <K extends keyof AppearanceSettings>(
  key: K,
  value: AppearanceSettings[K],
) => void;

export type SettingsSectionProps = {
  form: AppearanceSettings;
  set: SettingsSetter;
};
