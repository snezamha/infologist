import type { Locale } from "@/i18n/config";

type GeneratedMessageLoader = (
  locale: Locale,
) => Promise<Record<string, unknown>>;

const generatedProjectModuleMessageLoaders = {
  "resume-builder:en": async () =>
    import("../../../../../.private-modules/resume-builder/messages/en.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
  "resume-builder:fa": async () =>
    import("../../../../../.private-modules/resume-builder/messages/fa.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
  "resume-builder:de": async () =>
    import("../../../../../.private-modules/resume-builder/messages/de.json").then(
      (module) => module.default as Record<string, unknown>,
    ),
} satisfies Record<string, GeneratedMessageLoader>;

export function getGeneratedProjectModuleMessageLoaders(locale: Locale) {
  return Object.fromEntries(
    Object.entries(generatedProjectModuleMessageLoaders)
      .filter(([key]) => key.endsWith(`:${locale}`))
      .map(([key, loader]) => [key.slice(0, -locale.length - 1), loader]),
  ) as Record<string, GeneratedMessageLoader>;
}
