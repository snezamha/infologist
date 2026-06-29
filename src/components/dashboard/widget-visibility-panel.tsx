"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LayoutDashboard } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { writeStoredHidden } from "@/components/dashboard/sortable-dashboard";

function readHidden(storageKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.hidden) ? (parsed.hidden as string[]) : [];
  } catch {
    return [];
  }
}

function getHiddenSnapshot(storageKey: string) {
  return JSON.stringify(readHidden(storageKey));
}

function getServerHiddenSnapshot() {
  return "[]";
}

function subscribeHidden(storageKey: string, onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) onStoreChange();
  }

  const eventName = `dashboard-layout-change:${storageKey}`;

  window.addEventListener("storage", handleStorage);
  window.addEventListener(eventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(eventName, onStoreChange);
  };
}

export function useWidgetVisibility(
  allWidgetIds: string[],
  storageKey: string,
) {
  const hiddenSnapshot = useSyncExternalStore(
    useCallback(
      (onStoreChange) => subscribeHidden(storageKey, onStoreChange),
      [storageKey],
    ),
    useCallback(() => getHiddenSnapshot(storageKey), [storageKey]),
    getServerHiddenSnapshot,
  );
  const hidden = useMemo(() => {
    try {
      const parsed = JSON.parse(hiddenSnapshot);
      return Array.isArray(parsed)
        ? new Set<string>(parsed)
        : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, [hiddenSnapshot]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(hidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStoredHidden(storageKey, [...next]);
    },
    [hidden, storageKey],
  );

  const visibleWidgetIds = allWidgetIds.filter((id) => !hidden.has(id));

  return { hidden, toggle, visibleWidgetIds };
}

export function WidgetVisibilityPanel({
  allWidgetIds,
  widgetTitles,
  hidden,
  onToggle,
  customizeLabel,
}: {
  allWidgetIds: string[];
  widgetTitles: Record<string, string>;
  hidden: Set<string>;
  onToggle: (id: string) => void;
  customizeLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors hover:bg-accent"
          title={customizeLabel}
        >
          <LayoutDashboard className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="text-muted-foreground px-2 pb-2 text-xs font-medium">
          {customizeLabel}
        </p>
        <div className="space-y-0.5">
          {allWidgetIds.map((id) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-md px-2 py-1.5"
            >
              <span className="text-sm">{widgetTitles[id] ?? id}</span>
              <Switch
                checked={!hidden.has(id)}
                onCheckedChange={() => onToggle(id)}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
