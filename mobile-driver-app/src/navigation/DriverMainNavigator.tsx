import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DriverHomeScreen } from '@screens/home/DriverHomeScreen';
import { EarningsScreen } from '@screens/earnings/EarningsScreen';
import { DriverProfileScreen } from '@screens/profile/DriverProfileScreen';
import { RideRequestScreen } from '@screens/ride/RideRequestScreen';
import { ActiveRideScreen } from '@screens/ride/ActiveRideScreen';
import { WithdrawScreen } from '@screens/earnings/WithdrawScreen';

export type DriverMainStackParamList = {
  Tabs: undefined;
  RideRequest: {
    rideId: string;
    passengerId: string;
    origin: string;
    destination: string;
    amount: number;
  };
  ActiveRide: { rideId: string; passengerName: string; destination: string };
  Withdraw: { availableBalance: number; currency: string };
};

const Stack = createNativeStackNavigator<DriverMainStackParamList>();
const Tab = createBottomTabNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Panel: focused ? 'car' : 'car-outline',
            Earnings: focused ? 'cash' : 'cash-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#FFCD00',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#0033A0', borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0033A0' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Panel"
        component={DriverHomeScreen}
        options={{ title: 'Panel', headerShown: false }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Ganancias' }}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export function DriverMainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0033A0' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={DriverTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{ title: 'Solicitud de Viaje' }}
      />
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ title: 'Viaje Activo' }}
      />
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
        options={{ title: 'Retirar Ganancias', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
