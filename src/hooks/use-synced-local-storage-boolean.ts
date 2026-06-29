"use client";

import { useSyncExternalStore } from "react";

function readBooleanSnapshot(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function subscribeBooleanSnapshot(
  key: string,
  eventName: string,
  onStoreChange: () => void,
) {
  function handleStorage(event: StorageEvent) {
    if (event.key === key) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(eventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(eventName, onStoreChange);
  };
}

export function setSyncedLocalStorageBoolean(
  key: string,
  eventName: string,
  value: boolean,
) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}

  window.dispatchEvent(new Event(eventName));
}

export function useSyncedLocalStorageBoolean(key: string, eventName: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeBooleanSnapshot(key, eventName, onStoreChange),
    () => readBooleanSnapshot(key),
    () => false,
  );
}
