"use client";

import type { Locale } from "@/i18n/config";
import { LocaleFlag } from "@/i18n/flags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LocaleSwitcherItem = {
  locale: Locale;
  label: string;
  render?: React.ReactElement;
  onClick?: () => void;
};

type Props = {
  currentLocale: Locale;
  trigger: React.ReactElement;
  items: LocaleSwitcherItem[];
  dropdownLabel?: string;
};

export function LocaleSwitcherDropdown({
  currentLocale,
  trigger,
  items,
  dropdownLabel,
}: Props) {
  const menuItems = items.map(({ locale, label, render, onClick }) => (
    <DropdownMenuItem
      key={locale}
      disabled={locale === currentLocale}
      className={locale === currentLocale ? "font-medium" : undefined}
      render={render}
      onClick={onClick}
    >
      <span aria-hidden="true" className="grid size-5 place-items-center">
        <LocaleFlag locale={locale} className="w-5 rounded-[1px]" />
      </span>
      <span>{label}</span>
    </DropdownMenuItem>
  ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side="bottom" align="end">
        {dropdownLabel ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
            {menuItems}
          </DropdownMenuGroup>
        ) : (
          menuItems
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
