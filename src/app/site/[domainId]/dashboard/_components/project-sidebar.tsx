"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ChevronDown,
  BrainCircuit,
  FileCode2,
  FileText,
  Images,
  LayoutDashboard,
  PackageOpen,
  Puzzle,
  Settings,
  Settings2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

import { ResponsiveSidebar } from "@/components/dashboard/responsive-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildProjectHref } from "@/lib/projects/project/site";
import { cn } from "@/lib/utils";
import { useLiveProjectNavigation } from "@/hooks/use-live-project-navigation";
import type { ProjectNavigationState } from "@/lib/projects/navigation-state";
import type { Locale } from "@/i18n/config";
import { getLiveProjectNavigationState } from "@/app/site/[domainId]/dashboard/_actions/project-actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: NavItem[];
  matchActive?: (pathname: string) => boolean;
};

function isNavItemSelfActive(item: NavItem, pathname: string): boolean {
  if (item.matchActive) {
    return item.matchActive(pathname);
  }

  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function isNavItemBranchActive(item: NavItem, pathname: string): boolean {
  if (isNavItemSelfActive(item, pathname)) {
    return true;
  }

  return (
    item.children?.some((child) => isNavItemBranchActive(child, pathname)) ??
    false
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  nested,
  active,
  onNavigate,
}: NavItem & {
  collapsed?: boolean;
  nested?: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex w-full min-w-0 items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
        nested && !collapsed && "py-1.5 text-xs",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
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

function NavGroup({
  item,
  collapsed,
  isOpen,
  branchActive,
  onToggle,
  onNavigate,
  depth = 0,
  pathname,
  openItems,
  setOpenItems,
}: {
  item: NavItem;
  collapsed?: boolean;
  isOpen: boolean;
  branchActive: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  depth?: number;
  pathname: string;
  openItems: Record<string, boolean>;
  setOpenItems: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const selfActive = isNavItemSelfActive(item, pathname);
  const Icon = item.icon;

  const button = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full min-w-0 items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
        depth > 0 && !collapsed && "py-1.5 text-xs",
        selfActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          : branchActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center">
        <Icon className="size-4" />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
      )}
      {!collapsed && (
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent side="inline-end">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-1">
      {button}
      {isOpen ? (
        <div className={cn("space-y-1", depth === 0 ? "ps-9" : "ps-6")}>
          {item.children?.map((child) =>
            child.children ? (
              <NavGroup
                key={child.href}
                item={child}
                collapsed={collapsed}
                isOpen={
                  openItems[child.href] ??
                  isNavItemBranchActive(child, pathname)
                }
                branchActive={isNavItemBranchActive(child, pathname)}
                onToggle={() =>
                  setOpenItems((current) => ({
                    ...current,
                    [child.href]: !(
                      openItems[child.href] ??
                      isNavItemBranchActive(child, pathname)
                    ),
                  }))
                }
                onNavigate={onNavigate}
                depth={depth + 1}
                pathname={pathname}
                openItems={openItems}
                setOpenItems={setOpenItems}
              />
            ) : (
              <NavLink
                key={child.href}
                {...child}
                nested
                collapsed={collapsed}
                active={isNavItemSelfActive(child, pathname)}
                onNavigate={onNavigate}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

type PanelProps = {
  collapsed: boolean;
  mobile: boolean;
  navItems: NavItem[];
  projectName: string;
  closeLabel: string;
  onClose: () => void;
  pathname: string;
};

function SidebarPanel({
  collapsed,
  mobile,
  navItems,
  projectName,
  closeLabel,
  onClose,
  pathname,
}: PanelProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

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
              alt={projectName}
              width={16}
              height={16}
              className="size-4"
            />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-sm font-semibold">
              {projectName}
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
            "min-w-0 flex-1 space-y-1 overflow-y-auto",
            collapsed ? "p-2" : "p-3",
          )}
        >
          {navItems.map((item) =>
            item.children ? (
              <NavGroup
                key={item.href}
                item={item}
                collapsed={collapsed}
                isOpen={
                  openItems[item.href] ?? isNavItemBranchActive(item, pathname)
                }
                branchActive={isNavItemBranchActive(item, pathname)}
                onToggle={() =>
                  setOpenItems((current) => ({
                    ...current,
                    [item.href]: !(
                      openItems[item.href] ??
                      isNavItemBranchActive(item, pathname)
                    ),
                  }))
                }
                onNavigate={onClose}
                pathname={pathname}
                openItems={openItems}
                setOpenItems={setOpenItems}
              />
            ) : (
              <NavLink
                key={item.href}
                {...item}
                collapsed={collapsed}
                active={isNavItemSelfActive(item, pathname)}
                onNavigate={onClose}
              />
            ),
          )}
        </nav>
      </div>
    </TooltipProvider>
  );
}

type Props = {
  copy: {
    closeMenu: string;
    aiAssistant: string;
    dashboard: string;
    media: string;
    mediaLibrary: string;
    mediaUpload: string;
    management: string;
    pageBuilder: string;
    profile: string;
    promptTemplates: string;
    settings: string;
    statistics: string;
    modules: string;
  };
  domainId: string;
  locale: Locale;
  initialNavigation: ProjectNavigationState;
  projectName: string;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
};

export function ProjectSidebar({
  copy,
  domainId,
  locale,
  initialNavigation,
  projectName,
  open,
  collapsed,
  onClose,
}: Props) {
  const pathname = usePathname();
  const { state: navigation } = useLiveProjectNavigation({
    projectKey: domainId,
    initialState: initialNavigation,
    loadState: getLiveProjectNavigationState,
  });

  const navItems: NavItem[] = [
    {
      href: buildProjectHref(domainId, pathname, "/dashboard"),
      label: copy.dashboard,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: buildProjectHref(domainId, pathname, "/dashboard/profile"),
      label: copy.profile,
      icon: UserRound,
    },
    ...(navigation.features.statistics
      ? [
          {
            href: buildProjectHref(domainId, pathname, "/dashboard/statistics"),
            label: copy.statistics,
            icon: BarChart2,
          },
        ]
      : []),
    ...(navigation.features.mediaManagement
      ? [
          {
            href: buildProjectHref(domainId, pathname, "/dashboard/media"),
            label: copy.media,
            icon: Images,
            matchActive: () => false,
            children: [
              {
                href: buildProjectHref(domainId, pathname, "/dashboard/media"),
                label: copy.mediaLibrary,
                icon: Images,
                exact: true,
              },
              {
                href: buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/media/upload",
                ),
                label: copy.mediaUpload,
                icon: Upload,
              },
            ],
          },
        ]
      : []),
    ...(navigation.features.aiAssistant
      ? [
          {
            href: buildProjectHref(
              domainId,
              pathname,
              "/dashboard/ai-assistant/prompt-templates",
            ),
            label: copy.aiAssistant,
            icon: BrainCircuit,
            matchActive: (currentPathname: string) =>
              currentPathname.startsWith(
                buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/ai-assistant/",
                ),
              ),
            children: [
              {
                href: buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/ai-assistant/prompt-templates",
                ),
                label: copy.promptTemplates,
                icon: FileCode2,
              },
              {
                href: buildProjectHref(
                  domainId,
                  pathname,
                  "/dashboard/ai-assistant/settings",
                ),
                label: copy.management,
                icon: Settings2,
              },
            ],
          },
        ]
      : []),
    ...(navigation.features.pageBuilder
      ? [
          {
            href: buildProjectHref(
              domainId,
              pathname,
              "/dashboard/page-builder",
            ),
            label: copy.pageBuilder,
            icon: FileText,
          },
        ]
      : []),
    ...(navigation.modules.length > 0
      ? [
          {
            href: buildProjectHref(
              domainId,
              pathname,
              `/modules/${navigation.modules[0]!.key}`,
            ),
            label: copy.modules,
            icon: Puzzle,
            matchActive: (currentPathname: string) =>
              navigation.modules.some((module) =>
                currentPathname.startsWith(
                  buildProjectHref(
                    domainId,
                    pathname,
                    `/modules/${module.key}`,
                  ),
                ),
              ),
            children: navigation.modules.map((module) => ({
              href: buildProjectHref(
                domainId,
                pathname,
                `/modules/${module.key}`,
              ),
              label: module.title[locale],
              icon: PackageOpen,
            })),
          },
        ]
      : []),
    {
      href: buildProjectHref(domainId, pathname, "/dashboard/settings"),
      label: copy.settings,
      icon: Settings,
    },
  ];

  const panelProps = {
    navItems,
    projectName,
    closeLabel: copy.closeMenu,
    onClose,
    pathname,
  };

  const panel = (panelCollapsed: boolean, mobile: boolean) => (
    <SidebarPanel {...panelProps} collapsed={panelCollapsed} mobile={mobile} />
  );

  return (
    <ResponsiveSidebar open={open} collapsed={collapsed} renderPanel={panel} />
  );
}
