import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import SplashScreen from '../screens/splash/SplashScreen';

export function RootNavigator() {
  const { token } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  // Mostrar splash animado al primer arranque
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
