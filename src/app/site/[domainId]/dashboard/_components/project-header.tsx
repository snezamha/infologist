"use client";

import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  X,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/providers/theme-provider";
import type { Locale } from "@/i18n/config";
import type { ProjectSessionUser } from "@/lib/projects/project/_auth/get-session";
import { cn } from "@/lib/utils";
import { signOutFromProject } from "@/app/site/[domainId]/dashboard/_actions/project-actions";

import { ProjectLanguageSwitcher } from "./project-language-switcher";

type Props = {
  copy: {
    closeMenu: string;
    openMenu: string;
    signOut: string;
  };
  domainId: string;
  locale: Locale;
  user: ProjectSessionUser;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSidebarCollapseToggle: () => void;
};

export function ProjectHeader({
  copy,
  domainId,
  locale,
  user,
  sidebarOpen,
  sidebarCollapsed,
  onMenuOpen,
  onMenuClose,
  onSidebarCollapseToggle,
}: Props) {
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleSignOut() {
    startTransition(() => {
      signOutFromProject(domainId);
    });
  }

  return (
    <header
      className={cn(
        "bg-background/95 border-border sticky top-0 z-30 flex h-16 shrink-0 items-center border-b backdrop-blur",
        sidebarOpen && "z-[60]",
      )}
    >
      <div className="flex w-full items-center gap-4 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={sidebarOpen ? onMenuClose : onMenuOpen}
          className="size-9 shrink-0 rounded-full md:hidden"
          aria-label={sidebarOpen ? copy.closeMenu : copy.openMenu}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarCollapseToggle}
          className="hidden size-9 shrink-0 rounded-full md:inline-flex"
          aria-label={sidebarCollapsed ? copy.openMenu : copy.closeMenu}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ProjectLanguageSwitcher locale={locale} />

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(
                document.documentElement.classList.contains("dark")
                  ? "light"
                  : "dark",
              )
            }
            className="relative size-9 shrink-0 rounded-full"
            suppressHydrationWarning
          >
            <Sun
              aria-hidden
              className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90"
            />
            <Moon
              aria-hidden
              className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-full"
                >
                  <Avatar size="sm">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  {user.name ? (
                    <p className="text-sm font-medium">{user.name}</p>
                  ) : null}
                  {user.email ? (
                    <p className="text-muted-foreground text-xs">
                      {user.email}
                    </p>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isPending}
                onClick={handleSignOut}
                variant="destructive"
              >
                <LogOut className="size-4" />
                {copy.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
