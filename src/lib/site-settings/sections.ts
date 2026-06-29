const settingsSectionParam = "section";

export type SettingsSection = "seo" | "general" | "appearance";

export function getSettingsSectionHref(section: SettingsSection) {
  return `/dashboard/settings?${settingsSectionParam}=${section}`;
}
