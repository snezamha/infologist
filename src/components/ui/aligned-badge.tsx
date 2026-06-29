import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Badge>;

export function AlignedBadge({ className, ...props }: Props) {
  return (
    <Badge
      className={cn("min-w-24 justify-center whitespace-nowrap", className)}
      {...props}
    />
  );
}
