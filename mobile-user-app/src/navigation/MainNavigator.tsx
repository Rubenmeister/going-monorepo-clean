/**
 * MainNavigator
 *
 * Estructura:
 *   DrawerNavigator  ← abre el side menu lateral
 *     └─ "Main" → Stack Navigator con todas las pantallas
 *
 * Los modales de pantalla completa (ActiveRide, RateDriver, Payment, SOS, RideChat)
 * se apilan sobre el Drawer con presentation: 'fullScreenModal' para que el drawer
 * no sea accesible durante un viaje activo.
 */
import React from 'react';
import { TouchableOpacity, View, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// Screens — Transport
import HomeScreen from '@screens/home/HomeScreen';
import { ActiveRideScreen } from '@screens/ride/ActiveRideScreen';
import type { ActiveRideParams } from '@screens/ride/ActiveRideScreen';
import { RideChatScreen } from '@screens/ride/RideChatScreen';
import type { RideChatParams } from '@screens/ride/RideChatScreen';
import { RateDriverScreen } from '@screens/ride/RateDriverScreen';
import type { RateDriverParams } from '@screens/ride/RateDriverScreen';
import { SosScreen } from '@screens/ride/SosScreen';
import type { SosParams } from '@screens/ride/SosScreen';

// Screens — Discovery
import { ToursListScreen } from '@screens/tours/ToursListScreen';
import { AccommodationListScreen } from '@screens/accommodation/AccommodationListScreen';
import { ExperiencesListScreen } from '@screens/experiences/ExperiencesListScreen';
import { SearchScreen } from '@screens/search/SearchScreen';

// Screens — Bookings / History
import { BookingsScreen } from '@screens/bookings/BookingsScreen';
import { TripDetailScreen } from '@screens/bookings/TripDetailScreen';
import type { TripDetailParams } from '@screens/bookings/TripDetailScreen';

// Screens — Envíos
import { EnviosScreen } from '@screens/envios/EnviosScreen';
import { SharedRideBookingScreen } from '@screens/ride/SharedRideBookingScreen';
import type { SharedRideBookingParams } from '@screens/ride/SharedRideBookingScreen';
import { PrivateRideBookingScreen } from '@screens/ride/PrivateRideBookingScreen';
import type { PrivateRideBookingParams } from '@screens/ride/PrivateRideBookingScreen';
import { BookingOptionsScreen } from '@screens/ride/BookingOptionsScreen';
import type { BookingOptionsParams } from '@screens/ride/BookingOptionsScreen';
import { ScheduledSeatReservationScreen } from '@screens/ride/ScheduledSeatReservationScreen';
import type { ScheduledSeatReservationParams } from '@screens/ride/ScheduledSeatReservationScreen';
import { ConfirmRideScreen } from '@screens/ride/ConfirmRideScreen';
import type { ConfirmRideParams } from '@screens/ride/ConfirmRideScreen';
import { TripSummaryScreen } from '@screens/ride/TripSummaryScreen';
import { PuntosScreen } from '@screens/profile/PuntosScreen';
import { AcademiaScreen } from '@screens/academia/AcademiaScreen';
import type { TripSummaryParams } from '@screens/ride/TripSummaryScreen';
import { LocationPickerScreen } from '@screens/shared/LocationPickerScreen';
import type { LocationPickerParams } from '@screens/shared/LocationPickerScreen';
import { EnvioTrackingScreen } from '@screens/envios/EnvioTrackingScreen';
import type { EnvioTrackingParams } from '@screens/envios/EnvioTrackingScreen';

// Screens — Payments
import PaymentScreen from '@screens/payment/PaymentScreen';

// Screens — Profile / Account
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { PaymentMethodsScreen } from '@screens/profile/PaymentMethodsScreen';
import { NotificationSettingsScreen } from '@screens/profile/NotificationSettingsScreen';
import { SecurityScreen } from '@screens/profile/SecurityScreen';
import { UserSupportScreen } from '@screens/profile/UserSupportScreen';
import { TermsScreen } from '@screens/profile/TermsScreen';
import { PrivacyPolicyScreen } from '@screens/profile/PrivacyPolicyScreen';
import { SavedAddressesScreen } from '@screens/profile/SavedAddressesScreen';
import { WalletScreen } from '@screens/profile/WalletScreen';
import { CorporateScreen } from '@screens/profile/CorporateScreen';

// Drawer
import { GoingDrawer } from './GoingDrawer';

// ── Constants ─────────────────────────────────────────────────────────────────
const GOING_RED  = '#C0392B';
const DARK       = '#1A1A2E';

// ── Going logo en header de navegación ────────────────────────────────────────
function GoingHeaderLogo() {
  return (
    <Image
      source={require('../../assets/going-logo-horizontal.png')}
      style={{ width: 130, height: 55 }}
      resizeMode="contain"
    />
  );
}

// ── Param lists ───────────────────────────────────────────────────────────────
/** Wizard de inicio de viaje (Mobile #60 MVP):
 *  Home se reusa como hub del wizard. Al tap en "Compartido"/"Privado":
 *    1. Home navega a LocationPicker(returnScreen=Home, paramKey=pickup).
 *    2. LocationPicker vuelve a Home con `pickup` y `tripMode` set.
 *    3. Home (en useEffect) detecta pickup pero no destination → navega a
 *       LocationPicker para destination.
 *    4. LocationPicker vuelve a Home con `destination` set.
 *    5. Home detecta pickup + destination → navega a BookingOptions con
 *       las coords + vehicleType derivado de tripMode.
 *
 *  Este patrón evita crear una pantalla wizard separada (TripStartScreen).
 */
export type HomeWizardParams = {
  pickup?: { latitude: number; longitude: number; address?: string };
  destination?: { latitude: number; longitude: number; address?: string };
  tripMode?: 'compartido' | 'privado';
};

export type MainStackParamList = {
  // Core
  Home:               HomeWizardParams | undefined;
  Search:             undefined;
  // Bookings / History
  Historial:          undefined;
  TripDetail:         TripDetailParams;
  // Envíos
  Envios:             undefined;
  EnvioTracking:      EnvioTrackingParams;
  // Discovery
  Tours:              undefined;
  Experiences:        undefined;
  Accommodations:     undefined;
  // Payments
  Payment: {
    amount:       number;
    currency:     string;
    bookingId?:   string;
    rideId?:      string;
    description?: string;
  };
  // Profile
  Puntos:             undefined;
  EditProfile:        undefined;
  PaymentMethods:     undefined;
  NotificationSettings: undefined;
  Security:           undefined;
  UserSupport:        undefined;
  Terms:              undefined;
  Privacy:            undefined;
  SavedAddresses:     undefined;
  Wallet:             undefined;
  Corporate:          undefined;
  Academy:            undefined;
  // Booking flows
  SharedRideBooking:   SharedRideBookingParams;
  PrivateRideBooking:  PrivateRideBookingParams;
  /** Nuevo flujo unificado (carpool + ride-hailing). Reemplaza progresivamente
   *  a SharedRideBooking + PrivateRideBooking via el endpoint /search. */
  BookingOptions:      BookingOptionsParams;
  /** Detalle del scheduled trip + selector de asientos antes de ConfirmRide. */
  ScheduledSeatReservation: ScheduledSeatReservationParams;
  ConfirmRide:         ConfirmRideParams;
  TripSummary:         TripSummaryParams;
  LocationPicker:      LocationPickerParams;
  // Modals
  ActiveRide:         ActiveRideParams;
  RideChat:           RideChatParams;
  RateDriver:         RateDriverParams;
  Sos:                SosParams;
};

// ── Navigators ────────────────────────────────────────────────────────────────
const Stack  = createNativeStackNavigator<MainStackParamList>();
const Drawer = createDrawerNavigator();

/**
 * Inner stack — all non-modal screens accessible from the drawer.
 * HomeScreen adds the hamburger button that calls navigation.openDrawer().
 */
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: '#fff' },
        headerTintColor:  DARK,
        headerTitle:      () => <GoingHeaderLogo />,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle:     { backgroundColor: '#F7F8FA' },
      }}
    >
      {/* Home — header hidden (custom header inside screen) */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Search */}
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar' }}
      />

      {/* Historial */}
      <Stack.Screen
        name="Historial"
        component={BookingsScreen}
        options={{ title: 'Mi actividad' }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Detalle del viaje' }}
      />

      {/* Booking flows */}
      <Stack.Screen
        name="SharedRideBooking"
        component={SharedRideBookingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivateRideBooking"
        component={PrivateRideBookingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingOptions"
        component={BookingOptionsScreen}
        options={{ title: 'Opciones de viaje' }}
      />
      <Stack.Screen
        name="ScheduledSeatReservation"
        component={ScheduledSeatReservationScreen}
        options={{ title: 'Reservar asiento' }}
      />
      <Stack.Screen
        name="ConfirmRide"
        component={ConfirmRideScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripSummary"
        component={TripSummaryScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="LocationPicker"
        component={LocationPickerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />

      {/* Envíos */}
      <Stack.Screen
        name="Envios"
        component={EnviosScreen}
        options={{ title: 'Envíos' }}
      />
      <Stack.Screen
        name="EnvioTracking"
        component={EnvioTrackingScreen}
        options={{ title: 'Seguimiento' }}
      />

      {/* Discovery */}
      <Stack.Screen name="Tours"           component={ToursListScreen}          options={{ title: 'Destinos y Tours' }} />
      <Stack.Screen name="Experiences"     component={ExperiencesListScreen}    options={{ title: 'Experiencias' }} />
      <Stack.Screen name="Accommodations"  component={AccommodationListScreen}  options={{ title: 'Alojamiento' }} />

      {/* Payment */}
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Pago Seguro', presentation: 'modal' }}
      />

      {/* Profile / Account */}
      <Stack.Screen name="EditProfile"          component={EditProfileScreen}          options={{ title: 'Editar perfil' }} />
      <Stack.Screen name="PaymentMethods"        component={PaymentMethodsScreen}       options={{ title: 'Métodos de pago' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Security"             component={SecurityScreen}             options={{ title: 'Seguridad' }} />
      <Stack.Screen name="UserSupport"          component={UserSupportScreen}          options={{ title: 'Ayuda y soporte' }} />
      <Stack.Screen name="Terms"               component={TermsScreen}                options={{ title: 'Términos y condiciones' }} />
      <Stack.Screen name="Privacy"             component={PrivacyPolicyScreen}        options={{ title: 'Política de privacidad' }} />
      <Stack.Screen name="SavedAddresses"      component={SavedAddressesScreen}       options={{ title: 'Mis direcciones' }} />
      <Stack.Screen name="Wallet"              component={WalletScreen}               options={{ title: 'Mi billetera' }} />
      <Stack.Screen name="Corporate"           component={CorporateScreen}            options={{ headerShown: false }} />

      <Stack.Screen name="Puntos"   component={PuntosScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="Academy" component={AcademiaScreen} options={{ headerShown: false }} />

      {/* ── Full-screen modals (drawer not accessible) ── */}
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="RideChat"
        component={RideChatScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="RateDriver"
        component={RateDriverScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Sos"
        component={SosScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function MainNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <GoingDrawer {...props} />}
      screenOptions={{
        headerShown:       false,   // each screen manages its own header
        drawerType:        'front', // slides over content (classic side menu)
        drawerStyle:       { width: '78%' },
        overlayColor:      'rgba(0,0,0,0.4)',
        swipeEdgeWidth:    40,      // swipe from left edge to open
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}
