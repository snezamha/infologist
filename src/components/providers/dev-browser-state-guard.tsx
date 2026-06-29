"use client";

import { useEffect } from "react";

const DEV_BROWSER_STATE_VERSION = "1";
const DEV_BROWSER_STATE_KEY = "infologist:dev-browser-state-cleared";

function isLocalDevelopmentOrigin() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost")
  );
}

function hasClearedBrowserState() {
  try {
    return (
      localStorage.getItem(DEV_BROWSER_STATE_KEY) === DEV_BROWSER_STATE_VERSION
    );
  } catch {
    return false;
  }
}

function markBrowserStateCleared() {
  try {
    localStorage.setItem(DEV_BROWSER_STATE_KEY, DEV_BROWSER_STATE_VERSION);
  } catch {}
}

export function DevBrowserStateGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!isLocalDevelopmentOrigin()) return;
    if (hasClearedBrowserState()) return;

    async function clearStaleBrowserState() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      markBrowserStateCleared();
    }

    void clearStaleBrowserState().catch(() => undefined);
  }, []);

  return null;
}
