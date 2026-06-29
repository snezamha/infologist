import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getRequestLocale } from "@/i18n/locale";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { getSession } from "@/lib/auth/get-session";

import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("title"),
  };
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthPage({ searchParams }: Props) {
  const locale = await getRequestLocale();

  setRequestLocale(locale);

  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(
    resolvedSearchParams.callbackUrl,
    locale,
  );

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
