import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Importamos pantallas
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Iconos (Asegúrate de haber instalado lucide-react-native)
import { Home, User } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navegación Principal (Tabs inferiores: Inicio y Perfil)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff4c41', // Rojo Going
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}

// App Principal
export const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Flujo: Primero Login, luego la App Principal */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;