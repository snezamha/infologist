"use client";

import { Loader2, LogOut, UserRound } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { signOutUser } from "@/app/[locale]/(dashboard)/dashboard/_actions/session-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

import { HeaderActionButton } from "./header-action-button";

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

type Props = {
  session: Session;
};

export function UserNav({ session }: Props) {
  const t = useTranslations("dashboard");
  const [isPending, startTransition] = useTransition();
  const displayName = session.user.name ?? session.user.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <HeaderActionButton aria-label={t("account")}>
            <Avatar size="sm">
              <AvatarImage
                src={session.user.image ?? undefined}
                alt={displayName}
              />
              <AvatarFallback>
                {getInitials(session.user.name, session.user.email)}
              </AvatarFallback>
            </Avatar>
          </HeaderActionButton>
        }
      />
      <DropdownMenuContent side="bottom" align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-muted-foreground text-xs">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
          <UserRound className="size-4" />
          {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await signOutUser();
            });
          }}
          variant="destructive"
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
