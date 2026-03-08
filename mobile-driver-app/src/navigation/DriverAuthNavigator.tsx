import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverLoginScreen } from '@screens/auth/DriverLoginScreen';

export type DriverAuthStackParamList = { Login: undefined };
const Stack = createNativeStackNavigator<DriverAuthStackParamList>();

export function DriverAuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={DriverLoginScreen} />
    </Stack.Navigator>
  );
}
