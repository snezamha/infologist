"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { locales, type Locale } from "@/i18n/config";
import { LocaleFlag } from "@/i18n/flags";
import { Link, usePathname } from "@/i18n/navigation";
import { buildSwitchHref } from "@/i18n/pathname";
import { LocaleSwitcherDropdown } from "@/components/shared/locale-switcher-dropdown";

import { HeaderActionButton } from "./header-action-button";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const switchHref = useMemo(
    () => buildSwitchHref(pathname, searchParams),
    [pathname, searchParams],
  );

  const items = locales.map((item) => ({
    locale: item,
    label: t(`languageNames.${item}`),
    render:
      item !== locale ? <Link href={switchHref} locale={item} /> : undefined,
  }));

  return (
    <LocaleSwitcherDropdown
      currentLocale={locale}
      trigger={
        <HeaderActionButton aria-label={t("language")}>
          <span className="grid size-4 place-items-center text-sm leading-none">
            <LocaleFlag locale={locale} className="w-4 rounded-[1px]" />
          </span>
        </HeaderActionButton>
      }
      items={items}
      dropdownLabel={t("language")}
    />
  );
}
