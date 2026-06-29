"use client";

import Image from "next/image";
import { Blocks, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/users/role";
import { ResponsiveSidebar } from "@/components/dashboard/responsive-sidebar";

import {
  filterNavItemsByRole,
  getCoreSidebarNavItems,
  type NavItem,
  type NavSection,
} from "./sidebar-nav-items";

type OpenItemsState = {
  routeKey: string;
  items: Record<string, boolean>;
};

function NavLink({
  href,
  icon: Icon,
  label,
  target,
  rel,
  isActive,
  nested = false,
  collapsed = false,
  onNavigate,
}: NavItem & {
  isActive: boolean;
  nested?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      target={target}
      rel={rel}
      prefetch={false}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        "flex w-full min-w-0 items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
        nested && !collapsed && "py-1.5 text-xs",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center">
        <Icon className="size-4" />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="inline-end">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function NavMenuButton({
  icon: Icon,
  label,
  isActive,
  isOpen,
  onClick,
  nested = false,
}: NavItem & {
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        nested && "py-1.5 text-xs",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-start">{label}</span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 transition-transform",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}

function CollapsedNavMenu({
  item,
  isActive,
  subItems,
  pathname,
  searchParams,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  subItems: NavItem[];
  pathname: string;
  searchParams: URLSearchParams;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-center rounded-lg p-2 transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            aria-label={item.label}
          >
            <Icon className="size-4" />
          </button>
        }
      />
      <DropdownMenuContent side="inline-end" align="start" className="min-w-40">
        <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
        {subItems.map((child) => {
          const ChildIcon = child.icon;
          const childActive = isNavItemActive(child, pathname, searchParams);

          return (
            <DropdownMenuItem
              key={child.href}
              className={cn("p-0", childActive && "font-medium")}
            >
              <Link
                href={child.href}
                prefetch={false}
                aria-current={childActive ? "page" : undefined}
                onClick={() => onNavigate?.()}
                className="flex w-full items-center gap-2 px-1.5 py-1"
              >
                <ChildIcon className="size-4" />
                <span>{child.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isNavItemActive(
  item: NavItem,
  pathname: string,
  searchParams: URLSearchParams,
) {
  if (item.matchActive) {
    return item.matchActive(pathname, searchParams);
  }

  const [itemPath, itemQuery = ""] = item.href.split("?");

  if (itemQuery) {
    return pathname === itemPath && searchParams.toString() === itemQuery;
  }

  if (item.children) {
    return itemPath === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  }

  return pathname === itemPath;
}

type SidebarPanelProps = {
  collapsed: boolean;
  mobile: boolean;
  sections: NavSection[];
  pathname: string;
  searchParams: URLSearchParams;
  onClose: () => void;
  onToggleItem: (item: NavItem, isActive: boolean) => void;
  getItemOpenState: (item: NavItem, isActive: boolean) => boolean;
  siteName: string;
  closeLabel: string;
};

function SidebarPanel({
  collapsed,
  mobile,
  sections,
  pathname,
  searchParams,
  onClose,
  onToggleItem,
  getItemOpenState,
  siteName,
  closeLabel,
}: SidebarPanelProps) {
  return (
    <TooltipProvider delay={0}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "border-sidebar-border flex h-16 shrink-0 items-center border-b",
            collapsed ? "justify-center px-2" : "gap-3 px-4",
          )}
        >
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <Image
              src="/favicon.ico"
              alt={siteName}
              width={16}
              height={16}
              className="size-4"
            />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-sm font-semibold">
              {siteName}
            </span>
          )}
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="text-sidebar-foreground hover:bg-sidebar-accent ms-auto grid size-8 shrink-0 place-items-center rounded-lg"
              aria-label={closeLabel}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <nav
          className={cn(
            "min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto",
            collapsed ? "p-2" : "p-3",
          )}
        >
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              {section.label && !collapsed ? (
                <p className="text-sidebar-foreground/60 px-3 pb-1 text-xs font-semibold tracking-wide uppercase">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => {
                const isActive = isNavItemActive(item, pathname, searchParams);
                const isOpen = getItemOpenState(item, isActive);
                const renderChild = (child: NavItem, depth = 1) => {
                  const childActive = isNavItemActive(
                    child,
                    pathname,
                    searchParams,
                  );
                  const childOpen = getItemOpenState(child, childActive);

                  return child.children ? (
                    <div key={child.href} className="space-y-1">
                      <NavMenuButton
                        {...child}
                        isActive={childActive}
                        isOpen={childOpen}
                        nested
                        onClick={() => onToggleItem(child, childActive)}
                      />
                      {!collapsed && childOpen ? (
                        <div
                          className={cn(
                            "space-y-1",
                            depth === 1 ? "ps-9" : "ps-6",
                          )}
                        >
                          {child.children.map((grandChild) =>
                            renderChild(grandChild, depth + 1),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <NavLink
                      key={child.href}
                      {...child}
                      nested
                      isActive={childActive}
                      onNavigate={onClose}
                    />
                  );
                };

                return (
                  <div key={item.href} className="space-y-1">
                    {item.children ? (
                      collapsed ? (
                        <CollapsedNavMenu
                          item={item}
                          isActive={isActive}
                          subItems={item.children}
                          pathname={pathname}
                          searchParams={searchParams}
                          onNavigate={onClose}
                        />
                      ) : (
                        <NavMenuButton
                          {...item}
                          isActive={isActive}
                          isOpen={isOpen}
                          onClick={() => onToggleItem(item, isActive)}
                        />
                      )
                    ) : (
                      <NavLink
                        {...item}
                        isActive={isActive}
                        collapsed={collapsed}
                        onNavigate={onClose}
                      />
                    )}
                    {!collapsed && isOpen && item.children ? (
                      <div className="space-y-1 ps-9">
                        {item.children.map((child) => renderChild(child))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
}

type Props = {
  open: boolean;
  collapsed: boolean;
  role: Role;
  onClose: () => void;
};

export function AppSidebar({ open, collapsed, role, onClose }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openItemsState, setOpenItemsState] = useState<OpenItemsState>({
    routeKey: "",
    items: {},
  });
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const routeKey = pathname;
  const openItems =
    openItemsState.routeKey === routeKey ? openItemsState.items : {};

  function getItemOpenState(item: NavItem, isActive: boolean) {
    return openItems[item.href] ?? isActive;
  }

  function toggleItem(item: NavItem, isActive: boolean) {
    const isOpen = getItemOpenState(item, isActive);

    setOpenItemsState({
      routeKey,
      items: { ...openItems, [item.href]: !isOpen },
    });
  }

  const coreLabels = {
    dashboard: t("nav.dashboard"),
    profile: t("nav.profile"),
    users: t("nav.users"),
    projects: t("nav.projects"),
    projectFeatures: t("nav.projectFeatures"),
    settings: t("nav.settings"),
  };

  const projectMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
  const projectPublicId =
    projectMatch?.[1] && projectMatch[1] !== "new" ? projectMatch[1] : null;
  const navItems = getCoreSidebarNavItems(coreLabels);

  if (projectPublicId) {
    const projectIndex = navItems.findIndex(
      (item) => item.href === "/dashboard/projects",
    );
    navItems.splice(projectIndex + 1, 0, {
      href: `/dashboard/projects/${projectPublicId}/features`,
      icon: Blocks,
      label: coreLabels.projectFeatures,
      access: "projects.manage",
    });
  }

  const mainItems = filterNavItemsByRole(navItems, role);

  const sections: NavSection[] = [{ id: "main", items: mainItems }];

  const panelProps = {
    sections,
    pathname,
    searchParams,
    onClose,
    onToggleItem: toggleItem,
    getItemOpenState,
    siteName: tCommon("siteName"),
    closeLabel: tCommon("menu.close"),
  };

  const panel = (panelCollapsed: boolean, mobile: boolean) => (
    <SidebarPanel {...panelProps} collapsed={panelCollapsed} mobile={mobile} />
  );

  return (
    <ResponsiveSidebar open={open} collapsed={collapsed} renderPanel={panel} />
  );
}
