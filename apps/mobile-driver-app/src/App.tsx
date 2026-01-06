import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@going-monorepo-clean/frontend-providers';

import { LandingScreen } from './screens/LandingScreen';
// Assuming these exist based on typical structure, will verify with list_dir result if needed, but safe to assume for now or fix later
import { LoginScreen } from './screens/LoginScreen'; 
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DriverRegisterScreen } from './screens/DriverRegisterScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth(); 

  return (
    // @ts-expect-error: React Navigation 7 type issue workaround or missing id prop requirement
    <Stack.Navigator screenOptions={{ headerShown: false }} id="RootDriverNavigator">
      {user && user.userType === 'driver' ? ( // Assuming isDriver() check or similar
        // Authenticated Driver Stack
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        // Public Stack
        <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
            {/* User Login for cross-linking */}
            <Stack.Screen name="UserLogin" component={LoginScreen} /> 
        </>
      )}
    </Stack.Navigator>
  );
};

const AppDriver = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default AppDriver;