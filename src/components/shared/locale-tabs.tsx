"use client";

import { useTranslations } from "next-intl";

import { locales, type Locale } from "@/i18n/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  value?: Locale;
  onValueChange?: (value: Locale) => void;
  children?: (locale: Locale) => React.ReactNode;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  triggerRender?: (locale: Locale, label: string) => React.ReactNode;
  namespace?: string;
  labelKey?: string;
};

export function LocaleTabs({
  value,
  onValueChange,
  children,
  className = "w-full",
  listClassName = "grid w-full grid-cols-3",
  contentClassName = "space-y-4",
  triggerRender,
  namespace = "pageBuilder",
  labelKey = "locales",
}: Props) {
  const t = useTranslations(namespace);

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange?.(v as Locale)}
      className={className}
    >
      <TabsList className={listClassName}>
        {locales.map((locale) => {
          const label = t(`${labelKey}.${locale}`);
          return (
            <TabsTrigger key={locale} value={locale}>
              {triggerRender ? triggerRender(locale, label) : label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {children
        ? locales.map((locale) => (
            <TabsContent
              key={locale}
              value={locale}
              className={contentClassName}
            >
              {children(locale)}
            </TabsContent>
          ))
        : null}
    </Tabs>
  );
}
