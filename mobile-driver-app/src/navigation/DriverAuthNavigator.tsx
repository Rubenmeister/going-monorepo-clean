import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverLoginScreen } from '@screens/auth/DriverLoginScreen';
import { DriverRegisterScreen } from '@screens/auth/DriverRegisterScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';

export type DriverAuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
const Stack = createNativeStackNavigator<DriverAuthStackParamList>();

export function DriverAuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={DriverLoginScreen} />
      <Stack.Screen name="Register" component={DriverRegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
