"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { LoadingColorMode } from "@/lib/site-settings/shared";

type LoadingSettings = {
  spinner: string;
  colorMode: LoadingColorMode;
  color: string;
  size: number;
};

const defaultSettings: LoadingSettings = {
  spinner: "90-ring-with-bg",
  colorMode: "theme",
  color: "#2563eb",
  size: 64,
};

const LoadingSettingsContext = createContext<LoadingSettings>(defaultSettings);

export function LoadingSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: LoadingSettings;
}) {
  return (
    <LoadingSettingsContext.Provider value={settings}>
      {children}
    </LoadingSettingsContext.Provider>
  );
}

export function useLoadingSettings() {
  return useContext(LoadingSettingsContext);
}
