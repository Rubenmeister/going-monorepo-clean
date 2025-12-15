import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@going-monorepo-clean/frontend-providers';

import { LandingScreen } from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen'; // Assuming this exists or we use the inline placeholder from before

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Home: undefined;
  // DriverLogin: undefined;
};

const AppNavigator = () => {
  const { user } = useAuth(); // Monitor auth state

  return (
    // @ts-ignore: React Navigation 7 type issue workaround or missing id prop requirement
    <Stack.Navigator screenOptions={{ headerShown: false }} id="RootNavigator">
      {user ? (
        // Authenticated Stack
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        // Public Stack
        <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            {/* Add Driver Login route here if we are directing them to a separate app or screen */}
            {/* <Stack.Screen name="DriverLogin" component={DriverLoginScreen} /> */}
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
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

export default App;