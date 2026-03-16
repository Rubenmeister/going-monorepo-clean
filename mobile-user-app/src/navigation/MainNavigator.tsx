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
import { ActiveRideScreen } from '@screens/ride/ActiveRideScreen';
import type { ActiveRideParams } from '@screens/ride/ActiveRideScreen';
import { RideChatScreen } from '@screens/ride/RideChatScreen';
import type { RideChatParams } from '@screens/ride/RideChatScreen';
import { RateDriverScreen } from '@screens/ride/RateDriverScreen';
import type { RateDriverParams } from '@screens/ride/RateDriverScreen';
// Profile sub-screens
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { TripDetailScreen } from '@screens/bookings/TripDetailScreen';
import type { TripDetailParams } from '@screens/bookings/TripDetailScreen';
import { PaymentMethodsScreen } from '@screens/profile/PaymentMethodsScreen';
import { NotificationSettingsScreen } from '@screens/profile/NotificationSettingsScreen';
import { SecurityScreen } from '@screens/profile/SecurityScreen';
import { UserSupportScreen } from '@screens/profile/UserSupportScreen';
import { TermsScreen } from '@screens/profile/TermsScreen';
import { SavedAddressesScreen } from '@screens/profile/SavedAddressesScreen';
import { WalletScreen } from '@screens/profile/WalletScreen';

// ── Type declarations ────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  ActiveRide: ActiveRideParams;
  RideChat: RideChatParams;
  RateDriver: RateDriverParams;
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
  // Profile sub-screens
  EditProfile: undefined;
  TripDetail: TripDetailParams;
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  Security: undefined;
  UserSupport: undefined;
  Terms: undefined;
  SavedAddresses: undefined;
  Wallet: undefined;
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
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="RideChat"
        component={RideChatScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="RateDriver"
        component={RateDriverScreen}
        options={{ headerShown: false, presentation: 'modal' }}
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
      {/* Profile sub-screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar perfil' }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Detalle del viaje' }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ title: 'Métodos de pago' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: 'Seguridad' }}
      />
      <Stack.Screen
        name="UserSupport"
        component={UserSupportScreen}
        options={{ title: 'Ayuda y soporte' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Términos y condiciones' }}
      />
      <Stack.Screen
        name="SavedAddresses"
        component={SavedAddressesScreen}
        options={{ title: 'Mis direcciones' }}
      />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Mi billetera' }} />
    </Stack.Navigator>
  );
}
