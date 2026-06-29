"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  collapsed: boolean;
  renderPanel: (collapsed: boolean, mobile: boolean) => ReactNode;
};

export function ResponsiveSidebar({ open, collapsed, renderPanel }: Props) {
  const leaveTimeoutRef = useRef<number | null>(null);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current !== null) {
        window.clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  function handleRailEnter() {
    if (!collapsed || open) return;

    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    setHoverExpanded(true);
  }

  function handleFlyoutLeave() {
    leaveTimeoutRef.current = window.setTimeout(() => {
      setHoverExpanded(false);
    }, 150);
  }

  const showFlyout = collapsed && hoverExpanded && !open;

  return (
    <>
      {!collapsed ? (
        <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-64 shrink-0 flex-col overflow-hidden border-e md:flex">
          {renderPanel(false, false)}
        </aside>
      ) : (
        <>
          <aside
            onMouseEnter={handleRailEnter}
            className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-16 shrink-0 flex-col overflow-hidden border-e md:flex"
          >
            {renderPanel(true, false)}
          </aside>

          {showFlyout ? (
            <aside
              onMouseEnter={handleRailEnter}
              onMouseLeave={handleFlyoutLeave}
              className="bg-sidebar border-sidebar-border motion-safe:animate-in motion-safe:fade-in-0 fixed inset-y-0 start-0 z-40 hidden w-64 flex-col overflow-hidden border-e shadow-lg motion-safe:duration-200 md:flex"
            >
              {renderPanel(false, false)}
            </aside>
          ) : null}
        </>
      )}

      {open ? (
        <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 start-0 z-50 flex w-64 flex-col overflow-hidden border-e md:hidden">
          {renderPanel(false, true)}
        </aside>
      ) : null}
    </>
  );
}
