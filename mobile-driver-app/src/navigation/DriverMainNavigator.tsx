/**
 * DriverMainNavigator
 *
 * Estructura:
 *   DrawerNavigator  ← sidebar lateral (hamburger)
 *     └─ "DriverStack" → Stack Navigator con todas las pantallas
 *
 * Los modales de viaje activo se apilan sobre el Drawer con
 * presentation: 'fullScreenModal' para que el drawer no sea accesible
 * durante un viaje en curso.
 */
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { DriverHomeScreen }       from '@screens/home/DriverHomeScreen';
import { EarningsScreen }         from '@screens/earnings/EarningsScreen';
import { WalletScreen }           from '@screens/earnings/WalletScreen';
import { DriverProfileScreen }    from '@screens/profile/DriverProfileScreen';
import { RideRequestScreen }      from '@screens/ride/RideRequestScreen';
import { ActiveRideScreen }       from '@screens/ride/ActiveRideScreen';
import { SharedActiveRideScreen } from '@screens/ride/SharedActiveRideScreen';
import type { SharedActiveRideParams } from '@screens/ride/SharedActiveRideScreen';
import { WithdrawScreen }         from '@screens/earnings/WithdrawScreen';
import { TripHistoryScreen }      from '@screens/earnings/TripHistoryScreen';
import { DocumentsScreen }        from '@screens/profile/DocumentsScreen';
import { DriverRatingsScreen }    from '@screens/profile/DriverRatingsScreen';
import { SupportScreen }          from '@screens/profile/SupportScreen';
import { AcademiaScreen }            from '@screens/academia/AcademiaScreen';
import { DriverScheduleScreen }      from '@screens/schedule/DriverScheduleScreen';
import { OportunisticoScreen }       from '@screens/ride/OportunisticoScreen';
import type { OportunisticoParams }   from '@screens/ride/OportunisticoScreen';
import { RecogidaPaqueteScreen }     from '@screens/envios/RecogidaPaqueteScreen';
import type { RecogidaPaqueteParams } from '@screens/envios/RecogidaPaqueteScreen';
import { EntregaPaqueteScreen }      from '@screens/envios/EntregaPaqueteScreen';
import type { EntregaPaqueteParams }  from '@screens/envios/EntregaPaqueteScreen';

// Drawer
import { DriverDrawer } from './DriverDrawer';

const NAVY   = '#0033A0';
const YELLOW = '#FFCD00';

// ── Param lists ──────────────────────────────────────────────────────────────

export type DriverMainStackParamList = {
  Tabs:            undefined;
  Schedule:        undefined;
  Oportunistico:   OportunisticoParams;
  RecogidaPaquete: RecogidaPaqueteParams;
  EntregaPaquete:  EntregaPaqueteParams;
  RideRequest: {
    rideId: string;
    passengerName: string;
    origin: string;
    destination: string;
    amount: number;
    paymentMethod?: 'cash' | 'card' | 'wallet';
    rideType?: 'private' | 'shared';
    passengerCount?: number;
    scheduledDate?: string;
  };
  ActiveRide: {
    rideId: string;
    passengerName: string;
    destination: string;
    paymentMethod: 'cash' | 'card' | 'wallet';
    fare: number;
  };
  SharedActiveRide: SharedActiveRideParams;
  Withdraw:    { availableBalance: number; currency: string };
  Wallet:      undefined;
  Documents:   undefined;
  Ratings:     undefined;
  Support:     undefined;
  TripHistory: undefined;
  Academia:    undefined;
};

const Stack   = createNativeStackNavigator<DriverMainStackParamList>();
const Tab     = createBottomTabNavigator();
const Drawer  = createDrawerNavigator();

// ── Bottom Tabs ──────────────────────────────────────────────────────────────

function DriverTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Panel:    focused ? 'car'     : 'car-outline',
            Earnings: focused ? 'cash'    : 'cash-outline',
            Academia: focused ? 'school'  : 'school-outline',
            Profile:  focused ? 'person'  : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor:   YELLOW,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle:             { backgroundColor: NAVY, borderTopWidth: 0 },
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
        headerStyle:             { backgroundColor: NAVY },
        headerTintColor:         '#fff',
        headerTitleStyle:        { fontWeight: 'bold' },
        // Hamburger button on every tab header
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
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
        name="Academia"
        component={AcademiaScreen}
        options={{ title: 'Academia', headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// ── Stack inside the Drawer ──────────────────────────────────────────────────

function DriverStack({ navigation }: any) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: NAVY },
        headerTintColor:  '#fff',
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 4 }}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Main tabs — headerShown:false so the tab navigator controls its own header */}
      <Stack.Screen
        name="Tabs"
        component={DriverTabs}
        options={{ headerShown: false }}
      />

      {/* Ride modals — no drawer access during active ride */}
      <Stack.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{ title: 'Solicitud de Viaje', headerLeft: undefined }}
      />
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ title: 'Viaje Activo', headerLeft: undefined, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="SharedActiveRide"
        component={SharedActiveRideScreen}
        options={{ title: 'Viaje Compartido', headerLeft: undefined, presentation: 'fullScreenModal' }}
      />

      {/* Modal screens */}
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
        options={{ title: 'Retirar Ganancias', presentation: 'modal' }}
      />

      {/* Sidebar-accessible screens */}
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'Wallet' }}
      />
      <Stack.Screen
        name="TripHistory"
        component={TripHistoryScreen}
        options={{ title: 'Mis Viajes' }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Mis Documentos' }}
      />
      <Stack.Screen
        name="Ratings"
        component={DriverRatingsScreen}
        options={{ title: 'Mis Calificaciones' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Soporte Going' }}
      />
      <Stack.Screen
        name="Academia"
        component={AcademiaScreen}
        options={{ title: 'Academia Going', headerShown: false }}
      />

      {/* ── Agenda de rutas ── */}
      <Stack.Screen
        name="Schedule"
        component={DriverScheduleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Oportunistico"
        component={OportunisticoScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
      />

      {/* ── Pantallas de Envíos ── */}
      <Stack.Screen
        name="RecogidaPaquete"
        component={RecogidaPaqueteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EntregaPaquete"
        component={EntregaPaqueteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ── Root: Drawer wrapping the Stack ─────────────────────────────────────────

export function DriverMainNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DriverDrawer {...props} />}
      screenOptions={{
        headerShown:          false,
        drawerType:           'slide',
        drawerStyle:          { width: 300 },
        overlayColor:         'rgba(0,0,0,0.4)',
        swipeEnabled:         true,
        swipeEdgeWidth:       40,
      }}
    >
      <Drawer.Screen
        name="DriverStack"
        component={DriverStack}
      />
    </Drawer.Navigator>
  );
}
