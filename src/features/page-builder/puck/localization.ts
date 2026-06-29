import type { Config } from "@puckeditor/core";

import type { Locale } from "@/i18n/config";
import { puckConfig } from "@/features/page-builder/puck/config";

export type PuckMetadata = {
  locale: Locale;
  emptyImage: string;
  emptyVideo: string;
  invalidVideo: string;
};

const metadata: Record<Locale, PuckMetadata> = {
  en: {
    locale: "en",
    emptyImage: "No image selected",
    emptyVideo: "No video URL",
    invalidVideo: "Invalid video URL",
  },
  de: {
    locale: "de",
    emptyImage: "Kein Bild ausgewählt",
    emptyVideo: "Keine Video-URL",
    invalidVideo: "Ungültige Video-URL",
  },
  fa: {
    locale: "fa",
    emptyImage: "تصویری انتخاب نشده است",
    emptyVideo: "نشانی ویدیو وارد نشده است",
    invalidVideo: "نشانی ویدیو نامعتبر است",
  },
};

function localizeFields(
  fields: Record<string, unknown>,
  locale: Locale,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, rawField]) => {
      const field = rawField as Record<string, unknown>;
      const nestedKey = field.arrayFields
        ? "arrayFields"
        : field.objectFields
          ? "objectFields"
          : null;

      return [
        key,
        {
          ...field,
          ...(nestedKey
            ? {
                [nestedKey]: localizeFields(
                  field[nestedKey] as Record<string, unknown>,
                  locale,
                ),
              }
            : {}),
        },
      ];
    }),
  );
}

export function getLocalizedPuckConfig(locale: Locale): Config {
  if (locale === "en") return puckConfig;

  return {
    ...puckConfig,
    categories: puckConfig.categories,
    components: Object.fromEntries(
      Object.entries(puckConfig.components).map(([key, component]) => [
        key,
        {
          ...component,
          fields: component.fields
            ? localizeFields(component.fields, locale)
            : undefined,
        },
      ]),
    ),
  } as Config;
}

export function getPuckMetadata(locale: Locale) {
  return metadata[locale];
}
