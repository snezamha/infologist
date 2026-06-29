"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";

import type { ProjectNavigationState } from "@/lib/projects/navigation-state";

const EVENT_NAME = "infologist:project-navigation-change";
const CHANNEL_NAME = "infologist-project-navigation";
const STORAGE_KEY = "infologist-project-navigation-change";

type NavigationChange = {
  id: string;
  projectKey: string;
  timestamp: number;
};

export function publishProjectNavigationChange(projectKey: string) {
  const change: NavigationChange = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    projectKey,
    timestamp: Date.now(),
  };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: change }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(change);
    channel.close();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(change));
  } catch {}
}

export function useLiveProjectNavigation({
  projectKey,
  initialState,
  hasInitialState = true,
  loadState,
}: {
  projectKey: string | null;
  initialState: ProjectNavigationState;
  hasInitialState?: boolean;
  loadState: (projectKey: string) => Promise<ProjectNavigationState>;
}) {
  const [snapshot, setSnapshot] = useState({
    projectKey,
    state: initialState,
    loaded: hasInitialState,
    signature: JSON.stringify(initialState),
  });
  const lastChangeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectKey) return;

    const activeProjectKey = projectKey;
    let active = true;
    let refreshing = false;

    async function refresh() {
      if (refreshing) return;
      refreshing = true;
      try {
        const state = await loadState(activeProjectKey);
        if (active) {
          const signature = JSON.stringify(state);
          setSnapshot((current) =>
            current.projectKey === activeProjectKey &&
            current.loaded &&
            current.signature === signature
              ? current
              : {
                  projectKey: activeProjectKey,
                  state,
                  loaded: true,
                  signature,
                },
          );
        }
      } catch {
      } finally {
        refreshing = false;
      }
    }

    function refreshMatchingProject(change: NavigationChange | null) {
      if (change && lastChangeIdRef.current === change.id) return;
      if (change) lastChangeIdRef.current = change.id;
      if (!change || change.projectKey === activeProjectKey) void refresh();
    }

    function handleWindowEvent(event: Event) {
      refreshMatchingProject(
        (event as CustomEvent<NavigationChange>).detail ?? null,
      );
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        refreshMatchingProject(JSON.parse(event.newValue) as NavigationChange);
      } catch {}
    }

    const channel =
      "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    if (channel) {
      channel.onmessage = (event: MessageEvent<NavigationChange>) =>
        refreshMatchingProject(event.data);
    }

    window.addEventListener(EVENT_NAME, handleWindowEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      channel?.close();
      window.removeEventListener(EVENT_NAME, handleWindowEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadState, projectKey]);

  return snapshot.projectKey === projectKey
    ? { state: snapshot.state, loaded: snapshot.loaded }
    : { state: initialState, loaded: hasInitialState };
}
