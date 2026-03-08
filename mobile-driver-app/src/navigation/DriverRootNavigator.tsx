import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDriverStore } from '@store/useDriverStore';
import { DriverAuthNavigator } from './DriverAuthNavigator';
import { DriverMainNavigator } from './DriverMainNavigator';

export function DriverRootNavigator() {
  const { token } = useDriverStore();
  return (
    <NavigationContainer>
      {token ? <DriverMainNavigator /> : <DriverAuthNavigator />}
    </NavigationContainer>
  );
}
