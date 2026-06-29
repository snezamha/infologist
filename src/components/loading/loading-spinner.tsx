"use client";

import { useEffect, useState } from "react";

import {
  defaultLoadingSpinner,
  loadLoadingSpinnerSvg,
  type LoadingSpinnerId,
} from "@/lib/loading-spinners";
import {
  resolveLoadingColor,
  type LoadingColorMode,
} from "@/lib/site-settings/shared";
import { cn } from "@/lib/utils";

type Props = {
  spinner: LoadingSpinnerId | string;
  colorMode: LoadingColorMode;
  color: string;
  size: number;
  className?: string;
};

export function LoadingSpinner({
  spinner,
  colorMode,
  color,
  size,
  className,
}: Props) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadLoadingSpinnerSvg(spinner)
      .then((content) => {
        if (!cancelled) {
          setSvg(content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          loadLoadingSpinnerSvg(defaultLoadingSpinner).then((content) => {
            if (!cancelled) {
              setSvg(content);
            }
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [spinner]);

  return (
    <span
      data-slot="loading-spinner"
      className={cn(
        "grid place-items-center [&_svg]:size-full [&_svg_*]:fill-current [&_svg_*]:stroke-current",
        className,
      )}
      style={{
        width: size,
        height: size,
        color: resolveLoadingColor(colorMode, color),
      }}
    >
      {svg ? (
        <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <span
          aria-hidden="true"
          className="block size-full animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        />
      )}
    </span>
  );
}
