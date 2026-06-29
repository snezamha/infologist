import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requirePermission } from "@/lib/auth/rbac";
import { getRequestLocale } from "@/i18n/locale";
import { getPageCount, parsePage, parseQuery } from "@/lib/pagination";

import { getUsers } from "./_actions/user-actions";
import { UsersView } from "./_components/users-view";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "users" });
  return { title: t("title") };
}

export default async function UsersPage({ searchParams }: Props) {
  const locale = await getRequestLocale();
  setRequestLocale(locale);

  const session = await requirePermission("users.read");
  const params = await searchParams;
  const page = parsePage(params.page);
  const query = parseQuery(params.q);
  const result = await getUsers({ page, query });
  const pageCount = getPageCount(result.total, result.pageSize);

  if (page > pageCount) {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("q", query);
    }

    if (pageCount > 1) {
      nextParams.set("page", String(pageCount));
    }

    const search = nextParams.toString();
    redirect(`/${locale}/dashboard/users${search ? `?${search}` : ""}`);
  }

  return (
    <UsersView
      users={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={query}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
