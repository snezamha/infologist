"use client";

import { forwardRef } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

const LTR_INPUT_TYPES = new Set([
  "date",
  "datetime-local",
  "email",
  "month",
  "number",
  "password",
  "tel",
  "time",
  "url",
  "week",
]);

const Input = forwardRef<HTMLInputElement, InputPrimitive.Props>(function Input(
  { className, dir, type, ...props },
  ref,
) {
  const resolvedDir =
    dir ?? (LTR_INPUT_TYPES.has(type ?? "text") ? "ltr" : undefined);

  return (
    <InputPrimitive
      ref={ref}
      data-slot="input"
      dir={resolvedDir}
      type={type}
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex h-9 w-full min-w-0 rounded-md border px-3 py-2 text-start text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/50 read-only:cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
