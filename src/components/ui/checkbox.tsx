"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
};

function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  id,
  name,
  value,
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? false,
  );
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  function handleClick() {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      data-disabled={disabled ? "" : undefined}
      data-checked={isChecked ? "" : undefined}
      onClick={handleClick}
      className={cn(
        "peer border-primary bg-background ring-offset-background inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
      <input
        type="checkbox"
        aria-hidden
        tabIndex={-1}
        className="sr-only"
        checked={isChecked}
        readOnly
        name={name}
        value={value}
        required={required}
      />
    </button>
  );
}

export { Checkbox };
