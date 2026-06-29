"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  setSyncedLocalStorageBoolean,
  useSyncedLocalStorageBoolean,
} from "@/hooks/use-synced-local-storage-boolean";
import type { Locale } from "@/i18n/config";
import type { ProjectSessionUser } from "@/lib/projects/project/_auth/get-session";
import type { ProjectNavigationState } from "@/lib/projects/navigation-state";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectHeader } from "./project-header";

const SIDEBAR_COLLAPSED_KEY = "project-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "project-sidebar-collapsed-change";

type Props = {
  domainId: string;
  dir: "ltr" | "rtl";
  locale: Locale;
  copy: {
    common: {
      closeMenu: string;
      openMenu: string;
      signOut: string;
    };
    navigation: {
      dashboard: string;
      media: string;
      mediaLibrary: string;
      mediaUpload: string;
      aiAssistant: string;
      management: string;
      pageBuilder: string;
      promptTemplates: string;
      profile: string;
      settings: string;
      statistics: string;
      modules: string;
    };
  };
  initialNavigation: ProjectNavigationState;
  projectName: string;
  user: ProjectSessionUser;
  children: React.ReactNode;
};

export function ProjectShell({
  domainId,
  dir,
  locale,
  copy,
  initialNavigation,
  projectName,
  user,
  children,
}: Props) {
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

  return (
    <div dir={dir} className="bg-background flex min-h-dvh items-start">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ProjectSidebar
        copy={{ closeMenu: copy.common.closeMenu, ...copy.navigation }}
        domainId={domainId}
        locale={locale}
        initialNavigation={initialNavigation}
        projectName={projectName}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectHeader
          copy={copy.common}
          domainId={domainId}
          locale={locale}
          user={user}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onMenuOpen={() => setSidebarOpen(true)}
          onMenuClose={() => setSidebarOpen(false)}
          onSidebarCollapseToggle={toggleSidebarCollapsed}
        />
        <main className="w-full flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
