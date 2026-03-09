import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@screens/home/HomeScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { BookingsScreen } from '@screens/bookings/BookingsScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import PaymentScreen from '@screens/payment/PaymentScreen';
import { AccommodationListScreen } from '@screens/accommodation/AccommodationListScreen';
import { ToursListScreen } from '@screens/tours/ToursListScreen';
import { ExperiencesListScreen } from '@screens/experiences/ExperiencesListScreen';

// ── Type declarations ────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Payment: {
    amount: number;
    currency: string;
    bookingId?: string;
    rideId?: string;
    description?: string;
  };
  Accommodations: undefined;
  Tours: undefined;
  Experiences: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

// ── Bottom tabs ──────────────────────────────────────────────────
function MainTabs() {
  const tabIcons: Record<string, [string, string]> = {
    Home: ['home', 'home-outline'],
    Search: ['search', 'search-outline'],
    Bookings: ['calendar', 'calendar-outline'],
    Profile: ['person', 'person-outline'],
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: GOING_YELLOW,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: GOING_BLUE,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: GOING_BLUE },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        // Use emoji fallback instead of Ionicons to avoid React 18 type issue
        tabBarLabel:
          route.name === 'Home'
            ? 'Inicio'
            : route.name === 'Search'
            ? 'Buscar'
            : route.name === 'Bookings'
            ? 'Viajes'
            : 'Perfil',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Root stack (tabs + modal screens) ───────────────────────────
export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GOING_BLUE },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Pago Seguro', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Accommodations"
        component={AccommodationListScreen}
        options={{ title: 'Alojamiento' }}
      />
      <Stack.Screen
        name="Tours"
        component={ToursListScreen}
        options={{ title: 'Tours' }}
      />
      <Stack.Screen
        name="Experiences"
        component={ExperiencesListScreen}
        options={{ title: 'Experiencias' }}
      />
    </Stack.Navigator>
  );
}
