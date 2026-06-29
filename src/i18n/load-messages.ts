import type { Locale } from "./config";
import { getGeneratedProjectModuleMessageLoaders } from "@/features/modules/_core/generated/module-messages";

type MessageLoader = (locale: Locale) => Promise<Record<string, unknown>>;

const aiAssistantMessageLoaders: Record<Locale, MessageLoader> = {
  en: () =>
    import("@/features/ai-assistant/messages/en.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
  de: () =>
    import("@/features/ai-assistant/messages/de.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
  fa: () =>
    import("@/features/ai-assistant/messages/fa.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
};

const MESSAGE_LOADERS: Record<string, MessageLoader> = {
  common: (locale) =>
    import(`@/messages/${locale}/common.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  auth: (locale) =>
    import(`@/messages/${locale}/auth.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  dashboard: (locale) =>
    import(`@/messages/${locale}/dashboard.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  metadata: (locale) =>
    import(`@/messages/${locale}/metadata.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  media: (locale) =>
    import(`@/features/media/messages/${locale}/media.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  profile: (locale) =>
    import(`@/messages/${locale}/profile.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  settings: (locale) =>
    import(`@/messages/${locale}/settings.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  users: (locale) =>
    import(`@/messages/${locale}/users.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  projects: (locale) =>
    import(`@/messages/${locale}/projects.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
  "ai-assistant": (locale) => aiAssistantMessageLoaders[locale](locale),
  pageBuilder: (locale) =>
    import(`@/features/page-builder/messages/${locale}.json`).then(
      (m) => m.default as Record<string, unknown>,
    ),
};

export async function loadMessages(
  locale: Locale,
): Promise<Record<string, unknown>> {
  const moduleLoaders = getGeneratedProjectModuleMessageLoaders(locale);

  const entries = await Promise.all(
    Object.entries({
      ...MESSAGE_LOADERS,
      ...moduleLoaders,
    }).map(async ([key, loader]) => [key, await loader(locale)]),
  );

  return Object.fromEntries(entries);
}
