"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppearancePreference = "graphite" | "slate" | "dark" | "light" | "system";
type ResolvedAppearance = "graphite" | "slate" | "dark" | "light";
type ResolvedColorScheme = "light" | "dark";

const STORAGE_KEY = "spendfence-theme-v1";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const THEME_COLORS: Record<ResolvedAppearance, string> = {
  graphite: "#0C1115",
  slate: "#101820",
  dark: "#080B0E",
  light: "#F4F7F6"
};
const LIGHT_FAVICON = "/favicon-light-32x32.png";
const DARK_FAVICON = "/favicon-dark-32x32.png";

type AppearanceContextValue = {
  preference: AppearancePreference;
  resolvedTheme: ResolvedColorScheme;
  setPreference: (preference: AppearancePreference) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === "graphite" || value === "slate" || value === "dark" || value === "light" || value === "system";
}

function getStoredPreference(): AppearancePreference {
  if (typeof window === "undefined") return "graphite";
  let stored: string | null = null;
  try {
    stored = window.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    stored = null;
  }
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return isAppearancePreference(stored) ? stored : "graphite";
}

function systemPrefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(DARK_QUERY).matches;
}

function resolveAppearance(preference: AppearancePreference): ResolvedAppearance {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  if (preference === "graphite" || preference === "slate" || preference === "dark" || preference === "light") return preference;
  return "graphite";
}

function colorSchemeForAppearance(appearance: ResolvedAppearance): ResolvedColorScheme {
  return appearance === "light" ? "light" : "dark";
}

function resolvePreference(preference: AppearancePreference) {
  const resolvedAppearance = resolveAppearance(preference);
  return {
    appearance: resolvedAppearance,
    colorScheme: colorSchemeForAppearance(resolvedAppearance)
  };
}

function syncThemeMeta(resolvedAppearance: ResolvedAppearance, colorScheme: ResolvedColorScheme) {
  const color = THEME_COLORS[resolvedAppearance];
  const favicon = colorScheme === "dark" ? DARK_FAVICON : LIGHT_FAVICON;
  const appleStatusBar = colorScheme === "dark" ? "black-translucent" : "default";
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
  const resolved = resolvePreference(preference);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved.colorScheme === "dark");
  root.dataset.appearance = preference;
  root.dataset.theme = resolved.appearance;
  root.style.colorScheme = resolved.colorScheme;
  syncThemeMeta(resolved.appearance, resolved.colorScheme);

  return resolved.colorScheme;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("graphite");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedColorScheme>("dark");

  useEffect(() => {
    const storedPreference = getStoredPreference();
    setPreferenceState(storedPreference);
    setResolvedTheme(applyAppearance(storedPreference));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_QUERY);

    function handleSystemChange() {
      const storedPreference = getStoredPreference();
      if (storedPreference === "system") setResolvedTheme(applyAppearance(storedPreference));
    }

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setPreference = useCallback((nextPreference: AppearancePreference) => {
    try {
      window.localStorage?.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // The visual preference can still be applied for this page view.
    }
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
    if (preference !== "graphite" && preference !== "slate" && preference !== "dark" && preference !== "light" && preference !== "system") preference = "graphite";
    var systemDark = window.matchMedia("${DARK_QUERY}").matches;
    var theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;
    var isDark = theme !== "light";
    var root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.dataset.appearance = preference;
    root.dataset.theme = theme;
    root.style.colorScheme = isDark ? "dark" : "light";
    var themeColors = ${JSON.stringify(THEME_COLORS)};
    var themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (themeMeta) themeMeta.setAttribute("content", themeColors[theme] || themeColors.graphite);
    var appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusMeta) appleStatusMeta.setAttribute("content", isDark ? "black-translucent" : "default");
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
