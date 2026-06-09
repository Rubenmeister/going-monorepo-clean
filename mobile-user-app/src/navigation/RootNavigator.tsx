import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import SplashScreen from '../screens/splash/SplashScreen';

export function RootNavigator() {
  const { token, isLoading, loadToken } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const bootstrapped = useRef(false);

  // Restore persisted token at app launch — solo una vez aunque StrictMode
  // o un re-mount intenten dispararlo dos veces.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    loadToken();
  }, []);

  // Show splash animation first
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  // Show spinner while checking stored token
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff4c41" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
