"use client";

import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { useLoadingSettings } from "@/components/providers/loading-context";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
};

export function SiteSpinner({ size = 32, className }: Props) {
  const { spinner, colorMode, color } = useLoadingSettings();
  return (
    <LoadingSpinner
      spinner={spinner}
      colorMode={colorMode}
      color={color}
      size={size}
      className={className}
    />
  );
}

export function SiteSpinnerSection({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <SiteSpinner size={size} />
    </div>
  );
}
