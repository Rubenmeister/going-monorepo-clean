import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DriverRootNavigator } from './src/navigation/DriverRootNavigator';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://b0da414a6b3987c9f9c94fde47f7296c@o4511372708020224.ingest.us.sentry.io/4511372739805184',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,
  integrations: [Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#FF4C41" />
        <DriverRootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
