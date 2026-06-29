"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlignedBadge } from "@/components/ui/aligned-badge";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DataTableColumnHeader } from "@/components/data-table/data-table";
import { ServerDataTable } from "@/components/data-table/server-data-table";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { DashboardUser } from "@/app/[locale]/(dashboard)/dashboard/users/_types/user";
import type { Role } from "@/lib/users/role";

import { UserActions } from "./user-actions";

type Props = {
  users: DashboardUser[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  currentUserId: string;
  currentUserRole: string;
};

export function UsersView({
  users,
  total,
  page,
  pageSize,
  query,
  currentUserId,
  currentUserRole,
}: Props) {
  const t = useTranslations("users");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const hasFilters = Boolean(query);

  function updateParams(
    next: Record<string, string | undefined>,
    options?: { replace?: boolean },
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      const search = params.toString();
      const target = search ? `${pathname}?${search}` : pathname;

      if (options?.replace) {
        router.replace(target);
        return;
      }

      router.push(target);
    });
  }

  function handleSearchChange(value: string) {
    updateParams(
      {
        q: value.trim() || undefined,
        page: undefined,
      },
      { replace: true },
    );
  }

  const columns: ColumnDef<DashboardUser>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.user")} />
      ),
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? user.email ?? ""}
              />
              <AvatarFallback>
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name ?? user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.email")} />
      ),
      cell: ({ row }) => (
        <span dir="ltr" className="text-sm">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.role")} />
      ),
      cell: ({ row }) => (
        <AlignedBadge variant={roleBadgeVariant(row.original.role)}>
          {t(`roles.${row.original.role}`)}
        </AlignedBadge>
      ),
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.status")} />
      ),
      cell: ({ row }) => (
        <AlignedBadge
          variant={row.original.emailVerified ? "success" : "outline"}
        >
          {row.original.emailVerified
            ? t("status.verified")
            : t("status.unverified")}
        </AlignedBadge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-start">{t("columns.actions")}</div>,
      cell: ({ row }) => (
        <div className="flex justify-start">
          <UserActions
            user={row.original}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        meta={t("totalUsers", { count: total })}
      />

      <ServerDataTable
        columns={columns}
        data={users}
        loading={isPending}
        noDataMessage={t("empty")}
        searchPlaceholder={t("filters.searchPlaceholder")}
        searchValue={query}
        onSearchChange={handleSearchChange}
        toolbarActions={
          hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                updateParams(
                  { q: undefined, page: undefined },
                  { replace: true },
                )
              }
            >
              {t("filters.reset")}
            </Button>
          ) : null
        }
        pagination={{
          page,
          pageSize,
          total,
          loading: isPending,
          onPageChange: (nextPage) =>
            updateParams({
              page: nextPage <= 1 ? undefined : String(nextPage),
            }),
        }}
      />
    </div>
  );
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.[0]?.toUpperCase() ?? "?";
}

function roleBadgeVariant(role: Role) {
  if (role === "super_admin") return "default" as const;
  if (role === "admin") return "warning" as const;
  return "outline" as const;
}
