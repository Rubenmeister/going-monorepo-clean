import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';

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
