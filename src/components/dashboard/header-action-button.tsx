"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Button>;

export function HeaderActionButton({ className, ...props }: Props) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9 shrink-0 rounded-full", className)}
      {...props}
    />
  );
}
