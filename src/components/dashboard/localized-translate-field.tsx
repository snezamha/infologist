"use client";

import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  sourceLocale: Locale;
  sourceValue: string;
  targetLocales: Locale[];
  onApply: (translations: Partial<Record<Locale, string>>) => void;
  children: ReactNode;
  className?: string;
};

export function LocalizedTranslateField({ children, className }: Props) {
  return <div className={cn("relative", className)}>{children}</div>;
}
