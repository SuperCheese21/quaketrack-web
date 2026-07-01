import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DARK_THEME_IDS, DEFAULT_THEME, THEMES } from './themes';

const STORAGE_KEY = 'quaketrack.theme';

const isKnownTheme = (id: string): boolean => THEMES.some((t) => t.id === id);

const loadTheme = (): string => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isKnownTheme(raw)) return raw;
  } catch {
    // ignore malformed / unavailable storage
  }
  return DEFAULT_THEME;
};

// Apply the theme to <html> and keep the browser UI `theme-color` meta in sync
// with the header (primary) color so the mobile status bar matches.
const applyTheme = (theme: string): void => {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  probe.className = 'bg-primary';
  html.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  if (color) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', color);
  }
};

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<string>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage write failures (private mode, etc.)
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      isDark: DARK_THEME_IDS.has(theme),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
