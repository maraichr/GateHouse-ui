import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'gh-studio-theme';

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemPreference() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored || 'system';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  const toggle = useCallback(() => {
    const resolved = theme === 'system' ? getSystemPreference() : theme;
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const isDark = theme === 'system' ? getSystemPreference() === 'dark' : theme === 'dark';

  // Apply on mount and when system preference changes
  useEffect(() => {
    applyTheme(theme);
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme, toggle, isDark };
}
