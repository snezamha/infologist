"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within Collapsible");
  }
  return context;
}

type CollapsibleProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function Collapsible({
  open: openProp,
  onOpenChange,
  children,
  defaultOpen = false,
}: CollapsibleProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const currentOpen = isControlled ? openProp : open;

  const handleSetOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <CollapsibleContext value={{ open: currentOpen, setOpen: handleSetOpen }}>
      <div>{children}</div>
    </CollapsibleContext>
  );
}

type CollapsibleTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactNode;
};

function CollapsibleTrigger({
  asChild,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen } = useCollapsibleContext();

  if (asChild) {
    const child = children as React.ReactElement<{
      onClick?: (e: React.MouseEvent<HTMLElement>) => void;
      "aria-expanded"?: boolean;
      "data-state"?: "open" | "closed";
    }>;

    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        setOpen(!open);
        child.props.onClick?.(e);
      },
      "aria-expanded": open,
      "data-state": open ? "open" : "closed",
    });
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext();

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className={className} {...props}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
