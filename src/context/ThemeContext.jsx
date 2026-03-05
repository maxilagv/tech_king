import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nexastore-theme";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

function isValidTheme(value) {
  return value === "light" || value === "dark";
}

function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (isValidTheme(current)) return current;
  return null;
}

function shouldReducePerformanceEffects(isNarrowViewport) {
  if (typeof window === "undefined") return false;
  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = String(connection?.effectiveType || "").toLowerCase();
  const slowConnection = effectiveType === "slow-2g" || effectiveType === "2g";
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const prefersReduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return Boolean(
    isNarrowViewport || saveData || slowConnection || lowMemory || lowCpu || prefersReduced
  );
}

function getInitialTheme() {
  const saved = getStoredTheme();
  if (saved) return saved;
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const connection =
      window.navigator?.connection ||
      window.navigator?.mozConnection ||
      window.navigator?.webkitConnection;

    const applyPerformanceMode = () => {
      const reduced = shouldReducePerformanceEffects(mediaQuery.matches);
      document.documentElement.setAttribute("data-performance", reduced ? "reduced" : "full");
    };

    applyPerformanceMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyPerformanceMode);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(applyPerformanceMode);
    }

    if (connection && typeof connection.addEventListener === "function") {
      connection.addEventListener("change", applyPerformanceMode);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", applyPerformanceMode);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(applyPerformanceMode);
      }

      if (connection && typeof connection.removeEventListener === "function") {
        connection.removeEventListener("change", applyPerformanceMode);
      }
    };
  }, []);

  const setTheme = (nextTheme) => {
    if (nextTheme !== "light" && nextTheme !== "dark") return;
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
