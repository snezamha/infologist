"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";
import { LocaleFlag } from "@/i18n/flags";
import { LocaleSwitcherDropdown } from "@/components/shared/locale-switcher-dropdown";
import { setProjectLocaleOverride } from "@/app/site/[domainId]/dashboard/_actions/project-actions";

type Props = {
  locale: Locale;
};

export function ProjectLanguageSwitcher({ locale }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const t = useTranslations("common");

  function handleLocaleChange(next: Locale) {
    startTransition(async () => {
      await setProjectLocaleOverride(next);
      router.refresh();
    });
  }

  const items = locales.map((l) => ({
    locale: l,
    label: t(`languageNames.${l}`),
    onClick: l !== locale ? () => handleLocaleChange(l) : undefined,
  }));

  return (
    <LocaleSwitcherDropdown
      currentLocale={locale}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full"
        >
          <span className="grid size-4 place-items-center text-sm leading-none">
            <LocaleFlag locale={locale} className="w-4 rounded-[1px]" />
          </span>
        </Button>
      }
      items={items}
      dropdownLabel={t("language")}
    />
  );
}
