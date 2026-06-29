"use client";

import { Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";

type Props = {
  session: Session;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSidebarCollapseToggle: () => void;
};

export function DashboardHeader({
  session,
  sidebarOpen,
  sidebarCollapsed,
  onMenuOpen,
  onMenuClose,
  onSidebarCollapseToggle,
}: Props) {
  const t = useTranslations("common");

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
          aria-label={sidebarOpen ? t("menu.close") : t("menu.open")}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarCollapseToggle}
          className="hidden size-9 shrink-0 rounded-full md:inline-flex"
          aria-label={
            sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")
          }
        >
          {sidebarCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserNav session={session} />
        </div>
      </div>
    </header>
  );
}
