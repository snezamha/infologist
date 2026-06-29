"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const themeStorageKey = "theme";
const themeChangeEvent = "theme-change";
const mediaQuery = "(prefers-color-scheme: dark)";
const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme() {},
});

function getStoredTheme(): Theme {
  try {
    const theme = localStorage.getItem(themeStorageKey);

    return theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  } catch {
    return "system";
  }
}

function getServerTheme(): Theme {
  return "system";
}

function getResolvedTheme(theme: Theme): ResolvedTheme {
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return window.matchMedia(mediaQuery).matches ? "dark" : "light";
}

function getResolvedThemeSnapshot(): ResolvedTheme {
  return getResolvedTheme(getStoredTheme());
}

function getServerResolvedTheme(): ResolvedTheme {
  return "light";
}

function subscribeTheme(onStoreChange: () => void) {
  const media = window.matchMedia(mediaQuery);

  function handleStorage(event: StorageEvent) {
    if (event.key === themeStorageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(themeChangeEvent, onStoreChange);
  media.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(themeChangeEvent, onStoreChange);
    media.removeEventListener("change", onStoreChange);
  };
}

function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {}

  window.dispatchEvent(new Event(themeChangeEvent));
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getStoredTheme,
    getServerTheme,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedThemeSnapshot,
    getServerResolvedTheme,
  );

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setStoredTheme,
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
