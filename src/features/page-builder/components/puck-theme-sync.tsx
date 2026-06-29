"use client";

import { useEffect } from "react";

function syncPuckPreviewTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const scheme = isDark ? "dark" : "light";

  document
    .querySelectorAll<HTMLIFrameElement>("iframe#preview-frame")
    .forEach((frame) => {
      const root = frame.contentDocument?.documentElement;
      if (!root) {
        return;
      }

      root.classList.toggle("dark", isDark);
      root.style.colorScheme = scheme;
    });
}

export function PuckThemeSync() {
  useEffect(() => {
    syncPuckPreviewTheme();

    const htmlObserver = new MutationObserver(syncPuckPreviewTheme);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const bodyObserver = new MutationObserver(syncPuckPreviewTheme);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    function handleFrameLoad(event: Event) {
      const target = event.target;
      if (
        target instanceof HTMLIFrameElement &&
        target.id === "preview-frame"
      ) {
        syncPuckPreviewTheme();
      }
    }

    document.addEventListener("load", handleFrameLoad, true);

    return () => {
      htmlObserver.disconnect();
      bodyObserver.disconnect();
      document.removeEventListener("load", handleFrameLoad, true);
    };
  }, []);

  return null;
}
