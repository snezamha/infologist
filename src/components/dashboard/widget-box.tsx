"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const WidgetBox = React.forwardRef<
  HTMLDivElement,
  {
    title?: string;
    minimized?: boolean;
    onToggleMinimize?: () => void;
    headerStart?: React.ReactNode;
    headerEnd?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }
>(function WidgetBox(
  {
    title,
    minimized = false,
    onToggleMinimize,
    headerStart,
    headerEnd,
    children,
    className,
    style,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      style={style}
      className={cn("overflow-hidden rounded-xl", className)}
    >
      <div
        className={cn(
          "bg-muted/40 flex cursor-pointer items-center gap-2 border px-3 py-2 select-none transition-[border-radius] duration-200",
          minimized ? "rounded-xl" : "rounded-t-xl",
        )}
        onClick={onToggleMinimize}
      >
        {headerStart ? (
          <div onClick={(e) => e.stopPropagation()}>{headerStart}</div>
        ) : null}
        {title ? (
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs font-medium">
            {title}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {headerEnd}
          {onToggleMinimize ? (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
            >
              {minimized ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronUp className="size-3.5" />
              )}
            </button>
          ) : null}
        </div>
      </div>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: minimized ? "0fr" : "1fr" }}
      >
        <div
          className={cn(
            "bg-card min-h-0 min-w-0 overflow-hidden rounded-b-xl",
            !minimized && "border-x border-b",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
