"use server";

import { cookies } from "next/headers";

import { signIn } from "@/auth";
import { getSession } from "@/lib/auth/get-session";
import { getRequestLocale } from "@/i18n/locale";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { isSessionCookieName } from "@/lib/auth/session-cookies";

export async function signInWithGoogle(formData: FormData) {
  if (formData.get("termsAccepted") !== "on") {
    return;
  }

  const locale = await getRequestLocale();
  const redirectTo = sanitizeCallbackUrl(formData.get("callbackUrl"), locale);

  await signIn("google", { redirectTo });
}

export async function clearInvalidSessionCookie() {
  const session = await getSession();

  if (session) {
    return;
  }

  const cookieStore = await cookies();

  const secure = process.env.NODE_ENV === "production";

  for (const { name } of cookieStore.getAll()) {
    if (isSessionCookieName(name, secure)) {
      cookieStore.delete(name);
    }
  }
}
