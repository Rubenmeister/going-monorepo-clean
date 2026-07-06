import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';
import { loadMotorSnapshot } from './src/catalog/motorSnapshot';

// NOTA: Sentry quitado temporalmente del bundle para desbloquear el soft launch
// del 16-jun. @sentry/react-native@8.13 tiene doble registro nativo (Expo
// modules autolinking + RN autolinking) que rompe gradle 8.10 con
// "implicit dependency" en :sentry_react-native:packageReleaseResources.
// Re-integrar post-launch con versión 7.x o configurando autolinking exclude.
// Crash logs entretanto: Play Console + Firebase Crashlytics (ya integrado).

/**
 * StatusBarThemed — adapta el StatusBar al theme activo.
 *
 * Antes era hardcoded a 'light' con backgroundColor '#0033A0' (azul brand).
 * Ahora respeta el modo del theme: barra de status oscura sobre claro y
 * viceversa. Vive dentro del ThemeProvider para poder usar useTheme().
 */
function StatusBarThemed() {
  const { isDark, tokens } = useTheme();
  return (
    <StatusBar
      style={isDark ? 'light' : 'dark'}
      backgroundColor={tokens.bg}
    />
  );
}

export default function App() {
  // Al arrancar, baja el snapshot del MOTOR DE TARIFAS (Atlas) y sobrescribe la
  // tabla local → el móvil cotiza con los MISMOS precios que el backend (igual
  // que el webapp). Fire-and-forget; si falla, usa el mirror bundleado.
  useEffect(() => { loadMotorSnapshot(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarThemed />
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
