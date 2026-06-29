import { DE, GB, IR } from "country-flag-icons/react/3x2";

import type { Locale } from "./config";

const localeFlagComponents = {
  en: GB,
  de: DE,
  fa: IR,
} satisfies Record<Locale, React.ComponentType<{ className?: string }>>;

type LocaleFlagProps = {
  locale: Locale;
  className?: string;
};

export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const Flag = localeFlagComponents[locale];

  return <Flag className={className} />;
}
