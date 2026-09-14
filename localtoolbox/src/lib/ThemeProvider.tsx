import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_THEME, isThemeId, THEMES, type ThemeId } from "./themes";

const STORAGE_KEY = "ltb-theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function appearanceOf(id: ThemeId): "dark" | "light" {
  return THEMES.find((t) => t.id === id)?.appearance ?? "dark";
}

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  const appearance = appearanceOf(id);
  root.setAttribute("data-theme", id);
  root.setAttribute("data-appearance", appearance);
  root.style.colorScheme = appearance;
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", appearance);
}

function readStored(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* private mode / blocked storage */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStored);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && isThemeId(event.newValue)) {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
