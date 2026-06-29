import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: Props) {
  return (
    <Card className={cn("gap-5 py-5 sm:py-6", className)}>
      <CardHeader className="px-5 sm:px-6">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("px-5 sm:px-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
