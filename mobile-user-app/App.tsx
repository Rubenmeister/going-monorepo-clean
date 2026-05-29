import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://ba1c5f09904a24bb120b61f18580f6d3@o4511372708020224.ingest.us.sentry.io/4511372720144384',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(function App() {
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
});
