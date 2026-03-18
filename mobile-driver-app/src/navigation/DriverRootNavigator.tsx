import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useDriverStore } from '@store/useDriverStore';
import { DriverAuthNavigator } from './DriverAuthNavigator';
import { DriverMainNavigator } from './DriverMainNavigator';

export function DriverRootNavigator() {
  const { token, isLoading, loadToken } = useDriverStore();

  // Restore persisted token from AsyncStorage on app launch
  useEffect(() => {
    loadToken();
  }, []);

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
      {token ? <DriverMainNavigator /> : <DriverAuthNavigator />}
    </NavigationContainer>
  );
}
