/**
 * ThemeProvider — Going Ecuador mobile-user-app
 *
 * Provee el theme actual (light o dark) a toda la app vía Context.
 * Resuelve el modo con esta prioridad:
 *
 *   1. Override manual del usuario (persistido en AsyncStorage)
 *   2. useColorScheme() del device (auto-respeta system preference)
 *   3. Default light (si nada de lo anterior)
 *
 * Setting de override: el usuario va a Profile → Apariencia y elige
 * 'Sistema' | 'Claro' | 'Oscuro'. Se persiste y aplica al instante sin
 * reload.
 *
 * Patrón de uso en componentes:
 *
 *   const { tokens, isDark, mode, setMode } = useTheme();
 *   // tokens.bg, tokens.textPrimary, tokens.neonCyan, etc.
 *
 * Para pantallas HERO que deben ser SIEMPRE dark (Splash, SOS, Voice call),
 * pueden importar darkTokens directamente sin pasar por useTheme —
 * documentado en cada caso.
 */
import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkTokens, lightTokens, tourismPalette,
  type ThemeTokens,
} from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  /** Modo seleccionado por el usuario (incluye 'system' como auto). */
  mode: ThemeMode;
  /** Cambia el modo y lo persiste. */
  setMode: (mode: ThemeMode) => Promise<void>;
  /** Tokens del modo activo (resuelto). Listo para usar. */
  tokens: ThemeTokens;
  /** True si el modo activo (resuelto) es oscuro. Útil para condicionales. */
  isDark: boolean;
  /** Palette de turismo (constante, no varía con el modo). */
  tourismPalette: typeof tourismPalette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'going_theme_mode_v1';

/**
 * Provider raíz. Va dentro de SafeAreaProvider y sobre el navigator.
 *
 * Read del AsyncStorage es async — durante el primer render usamos el
 * scheme del sistema como default optimista para evitar flash. Cuando
 * llega la preferencia guardada (si existe) se reemplaza sin re-mount.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();      // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Cargar preferencia persistida al montar
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // si falla AsyncStorage, mantenemos el cambio en memoria — el setting
      // se aplica esta sesión, no persiste. No es crítico.
    }
  }, []);

  // Resolución: mode override → systemScheme → 'light' default
  const isDark = useMemo(() => {
    if (mode === 'dark')  return true;
    if (mode === 'light') return false;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const tokens = isDark ? darkTokens : lightTokens;

  // Evitar exponer el contexto antes de cargar la preferencia previene
  // un brief flash si el usuario tenía override guardado opuesto al
  // system. Suspendemos el árbol mostrando children sin tokens — pero
  // como los hijos van a fallar useTheme(), preferimos no renderizar
  // hasta loaded.
  if (!loaded) {
    // Renderizamos children con un Context default optimista (mode=system,
    // resolvedDark según device). Si esto causa flash, mover a un splash
    // bridge entre Splash y app.
  }

  const value: ThemeContextValue = useMemo(() => ({
    mode,
    setMode,
    tokens,
    isDark,
    tourismPalette,
  }), [mode, setMode, tokens, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook principal. Tira si se llama fuera del provider (bug de wiring) —
 * mejor failure loud que devolver tokens stale o undefined.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      'useTheme() debe usarse dentro de <ThemeProvider>. ' +
      'Wrappear el root con <ThemeProvider> en App.tsx.',
    );
  }
  return ctx;
}

/**
 * Helper para componentes que solo quieren los tokens sin reactividad
 * sobre mode/setMode (micro-perf: skip re-renders cuando solo cambia
 * setMode sin cambio de tokens reales). Mismo tokens que useTheme().tokens.
 */
export function useThemeTokens(): ThemeTokens {
  return useTheme().tokens;
}
