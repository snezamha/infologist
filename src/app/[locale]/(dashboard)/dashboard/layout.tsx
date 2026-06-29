import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth/rbac";
import { getRequestLocale } from "@/i18n/locale";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await requireSession();

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
