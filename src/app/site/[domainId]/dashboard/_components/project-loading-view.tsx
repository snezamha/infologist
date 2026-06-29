"use client";

import { useEffect, useState } from "react";
import type { ProjectDbSettings } from "@/lib/projects/project/_db";
import { parseLoadingSettings } from "@/lib/site-settings/loading";
import type {
  LoadingColorMode,
  LoadingPosition,
} from "@/lib/site-settings/shared";
import { getLoadingSpinnerPath } from "@/lib/loading-spinners";
import { cn } from "@/lib/utils";

type Props = {
  settings: ProjectDbSettings;
};

export function ProjectLoadingView({ settings }: Props) {
  const appearanceObj =
    settings.appearance && typeof settings.appearance === "object"
      ? (settings.appearance as Record<string, unknown>)
      : {};

  const loading = parseLoadingSettings(appearanceObj?.loadingSettings);

  if (!loading.enabled) {
    return null;
  }

  return (
    <LoadingSpinner
      spinnerId={loading.spinner}
      position={loading.position}
      colorMode={loading.colorMode}
      color={loading.color}
      size={loading.size}
    />
  );
}

function LoadingSpinner({
  spinnerId,
  position,
  colorMode,
  color,
  size,
}: {
  spinnerId: string;
  position: LoadingPosition;
  colorMode: LoadingColorMode;
  color: string;
  size: number;
}) {
  const [svg, setSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(getLoadingSpinnerPath(spinnerId));
        const text = await response.text();
        setSvg(text);
      } catch (error) {
        console.error("Failed to load spinner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSvg();
  }, [spinnerId]);

  if (isLoading || !svg) {
    return null;
  }

  const positionClasses: Record<LoadingPosition, string> = {
    "top-start": "top-4 start-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-end": "top-4 end-4",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "bottom-start": "bottom-4 start-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-end": "bottom-4 end-4",
  };

  const spinnerColor = colorMode === "custom" ? color : "currentColor";

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none",
        positionClasses[position],
      )}
    >
      <div
        className="w-fit h-fit"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          color: spinnerColor,
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
