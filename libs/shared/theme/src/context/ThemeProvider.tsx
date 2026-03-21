'use client';

import React, { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeMode, ThemeConfig } from '../types';

export function ThemeProvider({
  children,
  config = {},
}: {
  children: React.ReactNode;
  config?: ThemeConfig;
}) {
  const [mode, setModeState] = useState<ThemeMode>(
    config.initialMode || 'system'
  );
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(
    'light'
  );

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    handleChange(darkModeQuery);
    darkModeQuery.addEventListener('change', handleChange);

    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  // Get actual theme based on mode
  const actualMode = mode === 'system' ? systemPreference : mode;
  const isDark = actualMode === 'dark';

  // Apply theme to document
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save preference
    const storageKey = config.storageKey || 'theme-mode';
    localStorage.setItem(storageKey, mode);
  }, [isDark, mode, config.storageKey]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storageKey = config.storageKey || 'theme-mode';
    const saved = localStorage.getItem(storageKey) as ThemeMode | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
