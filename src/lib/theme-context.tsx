"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ParticleConfig {
  count: number;
  color: string;           // template: {{opacity}}, {{glowOpacity}}, {{highlightOpacity}}
  glowColor?: string;
  highlightColor?: string;
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
  direction: "up" | "down" | "left" | "right";
  wobble?: boolean;
  maxWobble?: number;
  glow?: boolean;
}

export interface AmbientConfig {
  particles?: ParticleConfig;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  author?: string;
  description: string;
  preview: [string, string, string];
  variables: Record<string, string>;
  ambient?: AmbientConfig;
}

interface ThemeContextValue {
  theme: string;
  themes: ThemeDefinition[];
  currentTheme: ThemeDefinition | undefined;
  setTheme: (id: string) => void;
  loading: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "the-helm-theme";
const DEFAULT_THEME = "midnight";
const STYLE_TAG_ID = "theme-custom-styles";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Apply CSS variables from theme.json to :root */
function applyVariables(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/** Remove previously applied inline CSS variables */
function clearVariables(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const key of Object.keys(vars)) {
    root.style.removeProperty(key);
  }
}

/** Fetch & inject a theme's styles.css, replacing any previous injection */
async function injectStyles(themeId: string) {
  // Remove old injected style tag
  const existing = document.getElementById(STYLE_TAG_ID);
  if (existing) existing.remove();

  try {
    const res = await fetch(`/themes/${themeId}/styles.css`);
    if (!res.ok) return;
    const css = await res.text();
    if (!css.trim()) return;

    const style = document.createElement("style");
    style.id = STYLE_TAG_ID;
    style.textContent = css;
    document.head.appendChild(style);
  } catch {
    // styles.css is optional — silently ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const prevThemeRef = useRef<ThemeDefinition | undefined>(undefined);

  // Fetch theme index on mount
  useEffect(() => {
    // Immediately apply stored theme id to data-theme (before fetch completes)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setThemeId(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }

    fetch("/themes/index.json")
      .then((r) => r.json())
      .then((data: ThemeDefinition[]) => {
        setThemes(data);

        // Apply the stored (or default) theme's variables immediately
        const id = stored || DEFAULT_THEME;
        const def = data.find((t) => t.id === id) || data[0];
        if (def) {
          applyVariables(def.variables);
          document.documentElement.setAttribute("data-theme", def.id);
          injectStyles(def.id);
          prevThemeRef.current = def;
          setThemeId(def.id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Apply theme whenever themeId changes (after initial load)
  const setTheme = useCallback(
    (newId: string) => {
      const def = themes.find((t) => t.id === newId);
      if (!def) return;

      // Clear old variables
      if (prevThemeRef.current) {
        clearVariables(prevThemeRef.current.variables);
      }

      // Apply new
      applyVariables(def.variables);
      document.documentElement.setAttribute("data-theme", def.id);
      injectStyles(def.id);
      localStorage.setItem(STORAGE_KEY, def.id);
      prevThemeRef.current = def;
      setThemeId(def.id);
    },
    [themes]
  );

  const currentTheme = themes.find((t) => t.id === themeId);

  return (
    <ThemeContext.Provider
      value={{ theme: themeId, themes, currentTheme, setTheme, loading }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
