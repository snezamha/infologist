"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionContextValue = {
  openItems: Set<string>;
  toggle: (id: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
}

type AccordionItemContextValue = {
  value: string;
  open: boolean;
  toggle: () => void;
};

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
};

function Accordion({
  type = "multiple",
  defaultValue,
  children,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (typeof defaultValue === "string") {
      return new Set([defaultValue]);
    }

    return new Set(defaultValue ?? []);
  });

  const toggle = React.useCallback(
    (id: string) => {
      setOpenItems((current) => {
        if (current.has(id)) {
          const next = new Set(current);
          next.delete(id);
          return next;
        }
        return type === "single" ? new Set([id]) : new Set([...current, id]);
      });
    },
    [type],
  );

  return (
    <AccordionContext value={{ openItems, toggle }}>
      <div className={cn("divide-y rounded-lg border", className)}>
        {children}
      </div>
    </AccordionContext>
  );
}

type AccordionItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

function AccordionItem({ value, children, className }: AccordionItemProps) {
  const { openItems, toggle } = useAccordionContext();
  const open = openItems.has(value);
  const itemToggle = React.useCallback(() => toggle(value), [toggle, value]);

  return (
    <AccordionItemContext value={{ value, open, toggle: itemToggle }}>
      <div data-accordion-item={value} className={className}>
        {children}
      </div>
    </AccordionItemContext>
  );
}

function AccordionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex", className)} {...props} />;
}

type AccordionTriggerProps = {
  value?: string;
  children: React.ReactNode;
  className?: string;
};

function AccordionTrigger({
  value: valueProp,
  children,
  className,
}: AccordionTriggerProps) {
  const itemCtx = React.useContext(AccordionItemContext);
  const { openItems, toggle } = useAccordionContext();
  const effectiveValue = valueProp ?? itemCtx?.value ?? "";
  const open = itemCtx?.open ?? openItems.has(effectiveValue);

  return (
    <button
      type="button"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={() => toggle(effectiveValue)}
      className={cn(
        "hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm font-medium transition-colors",
        className,
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

function AccordionTriggerPrimitive({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const itemCtx = React.useContext(AccordionItemContext);
  if (!itemCtx) {
    throw new Error(
      "AccordionTriggerPrimitive must be used within AccordionItem",
    );
  }
  return (
    <button
      type="button"
      aria-expanded={itemCtx.open}
      data-state={itemCtx.open ? "open" : "closed"}
      onClick={itemCtx.toggle}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

type AccordionContentProps = {
  value?: string;
  children: React.ReactNode;
  className?: string;
};

function AccordionContent({
  value: valueProp,
  children,
  className,
}: AccordionContentProps) {
  const itemCtx = React.useContext(AccordionItemContext);
  const { openItems } = useAccordionContext();
  const effectiveValue = valueProp ?? itemCtx?.value ?? "";
  const open = itemCtx?.open ?? openItems.has(effectiveValue);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className={cn("bg-muted/20 border-t px-4 py-4", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  AccordionTriggerPrimitive,
};
