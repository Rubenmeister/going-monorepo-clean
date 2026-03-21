/**
 * Going Platform Mobile App
 * React Native companion for iOS and Android
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Home,
  MapPin,
  FileText,
  Bell,
  Settings,
  LogOut,
} from 'react-native-feather';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import LocationTrackingScreen from './screens/LocationTrackingScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="DashboardHome"
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
  </Stack.Navigator>
);

const LocationStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="LocationTracking"
      component={LocationTrackingScreen}
      options={{ title: 'Location Tracking' }}
    />
  </Stack.Navigator>
);

const InvoicesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="InvoicesList"
      component={InvoicesScreen}
      options={{ title: 'Invoices' }}
    />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="NotificationsList"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="SettingsHome"
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  // TODO: Check authentication state
  const isSignedIn = true;

  return isSignedIn ? (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconProps = { width: size, height: size, color };

          switch (route.name) {
            case 'Dashboard':
              return <Home {...iconProps} />;
            case 'Location':
              return <MapPin {...iconProps} />;
            case 'Invoices':
              return <FileText {...iconProps} />;
            case 'Notifications':
              return <Bell {...iconProps} />;
            case 'Settings':
              return <Settings {...iconProps} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: '#4299E1',
        tabBarInactiveTintColor: '#A0AEC0',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationStack}
        options={{
          title: 'Location',
          tabBarLabel: 'Location',
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesStack}
        options={{
          title: 'Invoices',
          tabBarLabel: 'Invoices',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          title: 'Notifications',
          tabBarLabel: 'Notifications',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  ) : (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Login',
          animationEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
