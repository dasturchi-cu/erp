import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { createAppTheme } from './createTheme';
import type { ThemeMode } from '@/types';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'erp-theme-mode';

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  const resolvedMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedMode);
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const toggleMode = () => {
    setMode(resolvedMode === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(
    () => ({ mode, resolvedMode, setMode, toggleMode }),
    [mode, resolvedMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
}
