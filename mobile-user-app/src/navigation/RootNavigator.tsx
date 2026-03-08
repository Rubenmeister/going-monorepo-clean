import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export function RootNavigator() {
  const { token } = useAuthStore();
  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
