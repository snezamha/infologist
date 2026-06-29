"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { preloadLoadingSpinner } from "@/lib/loading-spinners";
import {
  type LoadingColorMode,
  type LoadingPosition,
} from "@/lib/site-settings/shared";

type Props = {
  enabled: boolean;
  spinner: string;
  position: LoadingPosition;
  colorMode: LoadingColorMode;
  color: string;
  size: number;
};

type Status = "idle" | "running" | "complete";

const SAFETY_TIMEOUT = 30000;

const positionClasses: Record<LoadingPosition, string> = {
  "top-start": "top-3 start-4",
  "top-center": "top-3 left-1/2 -translate-x-1/2",
  "top-end": "top-3 end-4",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-start": "bottom-4 start-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-end": "bottom-4 end-4",
};

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isInternalNavigation(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    anchor.target ||
    anchor.hasAttribute("download")
  ) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  return (
    `${url.pathname}${url.search}` !==
    `${window.location.pathname}${window.location.search}`
  );
}

export function RouteLoadingIndicator({
  enabled,
  spinner,
  position,
  colorMode,
  color,
  size,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [status, setStatus] = useState<Status>("idle");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startLocation = useRef("");
  const currentLocation = `${pathname}?${search}`;
  const indicatorSize = Math.max(32, Math.min(size, 128));

  useEffect(() => {
    if (enabled) {
      preloadLoadingSpinner(spinner);
    }
  }, [enabled, spinner]);

  useEffect(() => {
    if (status !== "running" || currentLocation === startLocation.current) {
      return;
    }

    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
    }

    setStatus("complete");

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    hideTimer.current = setTimeout(() => {
      setStatus("idle");
    }, 180);
  }, [currentLocation, status]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function begin() {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
      }

      setStatus("running");
      startLocation.current = `${window.location.pathname}?${window.location.search}`;

      fallbackTimer.current = setTimeout(() => {
        setStatus("complete");
        hideTimer.current = setTimeout(() => {
          setStatus("idle");
        }, 180);
      }, SAFETY_TIMEOUT);
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        isModifiedEvent(event)
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (
        !(anchor instanceof HTMLAnchorElement) ||
        !isInternalNavigation(anchor)
      ) {
        return;
      }

      begin();
    }

    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", begin);

    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", begin);
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
      }
    };
  }, [enabled]);

  if (!enabled || status === "idle") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    >
      <div
        className={`fixed ${positionClasses[position]} transition-opacity duration-150 ${status === "complete" ? "opacity-0" : "opacity-100"}`}
      >
        <LoadingSpinner
          spinner={spinner}
          colorMode={colorMode}
          color={color}
          size={indicatorSize}
        />
      </div>
    </div>
  );
}
