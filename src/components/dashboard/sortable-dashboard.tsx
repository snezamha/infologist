"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  parseDashboardLayout,
  type DashboardLayout,
  type DashboardLayoutItem,
} from "@/lib/dashboard/layout";
import { cn } from "@/lib/utils";
import { WidgetLoader } from "@/components/dashboard/widget-loader";
import { WidgetBox } from "@/components/dashboard/widget-box";

const ALWAYS_FULL_WIDGETS = new Set<string>();

function isAlwaysFullWidget(id: string) {
  return id.endsWith(":analytics") || ALWAYS_FULL_WIDGETS.has(id);
}

function normalizeLayoutItem(item: DashboardLayoutItem): DashboardLayoutItem {
  return isAlwaysFullWidget(item.id) ? { ...item, full: true } : item;
}

function readStoredLayout(storageKey: string): DashboardLayout | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return parseDashboardLayout(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readStoredLayoutSnapshot(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey);
}

function readStoredHidden(storageKey: string): string[] {
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

function writeStoredLayout(storageKey: string, items: DashboardLayoutItem[]) {
  if (typeof window === "undefined") return;
  try {
    const hidden = readStoredHidden(storageKey);
    window.localStorage.setItem(storageKey, JSON.stringify({ items, hidden }));
  } catch {}
}

export function writeStoredHidden(storageKey: string, hidden: string[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    window.localStorage.setItem(storageKey, JSON.stringify({ items, hidden }));
    window.dispatchEvent(new Event(getLayoutEventName(storageKey)));
  } catch {}
}

function getLayoutEventName(storageKey: string) {
  return `dashboard-layout-change:${storageKey}`;
}

function subscribeLayout(storageKey: string, onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) onStoreChange();
  }
  function handleLocalChange() {
    onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(getLayoutEventName(storageKey), handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      getLayoutEventName(storageKey),
      handleLocalChange,
    );
  };
}

function isLayoutItemsArray(
  value: unknown,
): value is { items: DashboardLayoutItem[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!("items" in value) || !Array.isArray(value.items)) return false;
  return value.items.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      typeof item.id === "string" &&
      "full" in item &&
      typeof item.full === "boolean",
  );
}

function buildInitialItems(
  initialLayout: DashboardLayout,
  activeWidgetIds: string[],
): DashboardLayoutItem[] {
  const activeSet = new Set(activeWidgetIds);
  let result: DashboardLayoutItem[] = [];

  if (isLayoutItemsArray(initialLayout)) {
    result = initialLayout.items
      .filter((item) => activeSet.has(item.id))
      .map(normalizeLayoutItem);
  } else if (Array.isArray(initialLayout)) {
    result = initialLayout
      .filter((id) => activeSet.has(id))
      .map((id) => ({ id, full: isAlwaysFullWidget(id), minimized: false }));
  }

  const seen = new Set(result.map((i) => i.id));
  activeWidgetIds.forEach((id) => {
    if (!seen.has(id))
      result.push({ id, full: isAlwaysFullWidget(id), minimized: false });
  });

  return result.map(normalizeLayoutItem);
}

function SortableWidget({
  item,
  title,
  onToggleFull,
  onToggleMinimize,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  expandLabel,
  collapseLabel,
  widgetProps = {},
}: {
  item: DashboardLayoutItem;
  title?: string;
  onToggleFull: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  expandLabel: string;
  collapseLabel: string;
  widgetProps?: Record<string, Record<string, unknown>>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
    gridColumn: item.full ? "1 / -1" : undefined,
  };

  const [moduleId, widgetId] = item.id.split(":");

  const headerStart = (
    <>
      <div
        className="hidden cursor-grab active:cursor-grabbing sm:flex"
        {...{ ...attributes, ...listeners }}
      >
        <GripVertical className="text-muted-foreground size-4 shrink-0" />
      </div>
      <div className="flex items-center gap-0.5 sm:hidden">
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={() => onMoveUp(item.id)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5 transition-colors"
        >
          <ArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={() => onMoveDown(item.id)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5 transition-colors"
        >
          <ArrowDown className="size-3.5" />
        </button>
      </div>
    </>
  );

  const headerEnd = !isAlwaysFullWidget(item.id) ? (
    <button
      type="button"
      onClick={() => onToggleFull(item.id)}
      title={item.full ? collapseLabel : expandLabel}
      className="text-muted-foreground hover:text-foreground hidden rounded p-0.5 transition-colors sm:flex"
    >
      {item.full ? (
        <Minimize2 className="size-3.5" />
      ) : (
        <Maximize2 className="size-3.5" />
      )}
    </button>
  ) : null;

  return (
    <WidgetBox
      ref={setNodeRef}
      style={style}
      className={cn("transition-opacity", isDragging ? "opacity-0" : "")}
      title={title}
      minimized={item.minimized}
      onToggleMinimize={() => onToggleMinimize(item.id)}
      headerStart={headerStart}
      headerEnd={headerEnd}
    >
      <WidgetLoader
        moduleId={moduleId!}
        widgetId={widgetId!}
        widgetProps={widgetProps[item.id]}
      />
    </WidgetBox>
  );
}

export function SortableDashboard({
  activeWidgetIds,
  storageKey,
  widgetTitles = {},
  defaultLayout = [],
  emptyLabel,
  expandLabel,
  collapseLabel,
  widgetProps = {},
}: {
  activeWidgetIds: string[];
  storageKey: string;
  widgetTitles?: Record<string, string>;
  widgetProps?: Record<string, Record<string, unknown>>;
  defaultLayout?: DashboardLayout;
  emptyLabel: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const storedLayoutSnapshot = React.useSyncExternalStore(
    useCallback(
      (onStoreChange) => subscribeLayout(storageKey, onStoreChange),
      [storageKey],
    ),
    useCallback(() => readStoredLayoutSnapshot(storageKey), [storageKey]),
    () => null,
  );

  const items = React.useMemo(
    () =>
      buildInitialItems(
        storedLayoutSnapshot
          ? (readStoredLayout(storageKey) ?? defaultLayout)
          : defaultLayout,
        activeWidgetIds,
      ),
    [activeWidgetIds, defaultLayout, storageKey, storedLayoutSnapshot],
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const persist = useCallback(
    (newItems: DashboardLayoutItem[]) => {
      writeStoredLayout(storageKey, newItems);
      window.dispatchEvent(new Event(getLayoutEventName(storageKey)));
    },
    [storageKey],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      persist(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleToggleFull = useCallback(
    (id: string) => {
      if (isAlwaysFullWidget(id)) return;
      persist(
        items.map((item) =>
          item.id === id ? { ...item, full: !item.full } : item,
        ),
      );
    },
    [persist, items],
  );

  const handleToggleMinimize = useCallback(
    (id: string) => {
      persist(
        items.map((item) =>
          item.id === id ? { ...item, minimized: !item.minimized } : item,
        ),
      );
    },
    [persist, items],
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const index = items.findIndex((i) => i.id === id);
      if (index <= 0) return;
      persist(arrayMove(items, index, index - 1));
    },
    [persist, items],
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const index = items.findIndex((i) => i.id === id);
      if (index < 0 || index >= items.length - 1) return;
      persist(arrayMove(items, index, index + 1));
    },
    [persist, items],
  );

  const activeItem = items.find((i) => i.id === activeId);

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        {emptyLabel}
      </div>
    );
  }

  const sharedProps = {
    onToggleFull: handleToggleFull,
    onToggleMinimize: handleToggleMinimize,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    expandLabel,
    collapseLabel,
    widgetProps,
  };

  return (
    <DndContext
      id="dashboard-layout-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={cn(
            "grid gap-6",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            activeId ? "cursor-grabbing select-none" : "",
          )}
        >
          {items.map((item, index) => (
            <SortableWidget
              key={item.id}
              item={item}
              title={widgetTitles[item.id]}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              {...sharedProps}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && activeItem ? (
          <WidgetBox
            className="pointer-events-none opacity-95 shadow-2xl"
            style={{ gridColumn: activeItem.full ? "1 / -1" : undefined }}
            title={widgetTitles[activeId]}
            minimized={activeItem.minimized}
          >
            {!activeItem.minimized && (
              <WidgetLoader
                moduleId={activeId.split(":")[0]!}
                widgetId={activeId.split(":")[1]!}
                widgetProps={widgetProps[activeId]}
              />
            )}
          </WidgetBox>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
