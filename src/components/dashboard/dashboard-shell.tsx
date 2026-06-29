"use client";

import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";
import type { Role } from "@/lib/users/role";
import { cn } from "@/lib/utils";
import {
  setSyncedLocalStorageBoolean,
  useSyncedLocalStorageBoolean,
} from "@/hooks/use-synced-local-storage-boolean";

import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";

const SIDEBAR_COLLAPSED_KEY = "dashboard-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "dashboard-sidebar-collapsed-change";

type Props = {
  session: Session;
  children: ReactNode;
};

export function DashboardShell({ session, children }: Props) {
  const pathname = usePathname();
  const [sidebarState, setSidebarState] = useState({ pathname, open: false });
  const sidebarCollapsed = useSyncedLocalStorageBoolean(
    SIDEBAR_COLLAPSED_KEY,
    SIDEBAR_COLLAPSED_EVENT,
  );
  const sidebarOpen =
    sidebarState.pathname === pathname ? sidebarState.open : false;

  function setSidebarOpen(open: boolean) {
    setSidebarState({ pathname, open });
  }

  function toggleSidebarCollapsed() {
    setSyncedLocalStorageBoolean(
      SIDEBAR_COLLAPSED_KEY,
      SIDEBAR_COLLAPSED_EVENT,
      !sidebarCollapsed,
    );
  }

  const isBuilderPage = false;

  return (
    <div
      className={cn(
        "bg-background flex items-start",
        isBuilderPage ? "h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AppSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        role={session.user.role as Role}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isBuilderPage && "h-full",
        )}
      >
        <DashboardHeader
          session={session}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onMenuOpen={() => setSidebarOpen(true)}
          onMenuClose={() => setSidebarOpen(false)}
          onSidebarCollapseToggle={toggleSidebarCollapsed}
        />
        <main
          className={cn(
            "w-full flex-1 overflow-x-hidden",
            isBuilderPage ? "min-h-0 overflow-hidden" : "p-4 md:p-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
