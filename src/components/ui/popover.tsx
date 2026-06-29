"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

type PopoverTriggerProps = {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        render={children as React.ReactElement}
        {...(props as object)}
      />
    );
  }
  return (
    <PopoverPrimitive.Trigger {...(props as object)}>
      {children}
    </PopoverPrimitive.Trigger>
  );
}

type PopoverContentProps = React.ComponentProps<"div"> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function PopoverContent({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "bg-popover text-popover-foreground data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95 data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95 z-50 w-72 rounded-lg border p-4 shadow-md outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
