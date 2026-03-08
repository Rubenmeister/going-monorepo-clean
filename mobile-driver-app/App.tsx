import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DriverRootNavigator } from './src/navigation/DriverRootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0033A0" />
        <DriverRootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
