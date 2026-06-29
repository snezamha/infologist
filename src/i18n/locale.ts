import { getLocale } from "next-intl/server";

import { type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  return (await getLocale()) as Locale;
}
