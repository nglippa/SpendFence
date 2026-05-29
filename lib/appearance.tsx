"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppearancePreference = "light" | "dark" | "system";

const STORAGE_KEY = "spendfence-theme-v1";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const LIGHT_THEME_COLOR = "#10161A";
const DARK_THEME_COLOR = "#0C1115";
const LIGHT_FAVICON = "/favicon-light-32x32.png";
const DARK_FAVICON = "/favicon-dark-32x32.png";

type AppearanceContextValue = {
  preference: AppearancePreference;
  resolvedTheme: "light" | "dark";
  setPreference: (preference: AppearancePreference) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getStoredPreference(): AppearancePreference {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAppearancePreference(stored) ? stored : "dark";
}

function resolvePreference(preference: AppearancePreference) {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function syncThemeMeta(resolvedTheme: "light" | "dark") {
  const color = resolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
  const appleStatusBar = "black-translucent";
  const favicon = resolvedTheme === "dark" ? DARK_FAVICON : LIGHT_FAVICON;
  let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  let appleStatusMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
  let faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-spendfence-theme-icon]');

  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    document.head.appendChild(themeMeta);
  }

  if (!appleStatusMeta) {
    appleStatusMeta = document.createElement("meta");
    appleStatusMeta.name = "apple-mobile-web-app-status-bar-style";
    document.head.appendChild(appleStatusMeta);
  }

  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "icon";
    faviconLink.type = "image/png";
    faviconLink.dataset.spendfenceThemeIcon = "true";
    document.head.appendChild(faviconLink);
  }

  themeMeta.content = color;
  appleStatusMeta.content = appleStatusBar;
  faviconLink.href = favicon;
}

function applyAppearance(preference: AppearancePreference) {
  const resolvedTheme = resolvePreference(preference);
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.appearance = preference;
  root.style.colorScheme = resolvedTheme;
  syncThemeMeta(resolvedTheme);

  return resolvedTheme;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const storedPreference = getStoredPreference();
    setPreferenceState(storedPreference);
    setResolvedTheme(applyAppearance(storedPreference));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_QUERY);

    function handleSystemChange() {
      setResolvedTheme(applyAppearance(getStoredPreference()));
    }

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setPreference = useCallback((nextPreference: AppearancePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
    setPreferenceState(nextPreference);
    setResolvedTheme(applyAppearance(nextPreference));
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference
    }),
    [preference, resolvedTheme, setPreference]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used within AppearanceProvider");
  return context;
}

export const appearanceInitScript = `
(function() {
  try {
    var storageKey = "${STORAGE_KEY}";
    var preference = localStorage.getItem(storageKey);
    if (preference !== "light" && preference !== "dark" && preference !== "system") preference = "dark";
    var isDark = preference === "dark" || (preference === "system" && window.matchMedia("${DARK_QUERY}").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.dataset.appearance = preference;
    root.style.colorScheme = isDark ? "dark" : "light";
    var themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (themeMeta) themeMeta.setAttribute("content", isDark ? "${DARK_THEME_COLOR}" : "${LIGHT_THEME_COLOR}");
    var appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusMeta) appleStatusMeta.setAttribute("content", "black-translucent");
    var faviconLink = document.querySelector('link[rel="icon"][data-spendfence-theme-icon]');
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.setAttribute("rel", "icon");
      faviconLink.setAttribute("type", "image/png");
      faviconLink.setAttribute("data-spendfence-theme-icon", "true");
      document.head.appendChild(faviconLink);
    }
    faviconLink.setAttribute("href", isDark ? "${DARK_FAVICON}" : "${LIGHT_FAVICON}");
  } catch (error) {}
})();
`;
