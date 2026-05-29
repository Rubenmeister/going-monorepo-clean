import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DriverRootNavigator } from './src/navigation/DriverRootNavigator';

// NOTA: Sentry quitado temporalmente del bundle para desbloquear el soft launch
// del 16-jun. @sentry/react-native@8.13 tiene doble registro nativo (Expo
// modules autolinking + RN autolinking) que rompe gradle 8.10 con
// "implicit dependency" en :sentry_react-native:packageReleaseResources.
// Re-integrar post-launch con versión 7.x o configurando autolinking exclude.
// Crash logs entretanto: Play Console + Firebase Crashlytics (ya integrado).

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#FF4C41" />
        <DriverRootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
