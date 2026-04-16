import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
// expo-blur removed — not needed for current implementation
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { transportAPI } from '../../services/api';
import { hapticMedium, hapticError, hapticLight } from '../../utils/haptics';
import { useSavedAddressesStore } from '../../store/useSavedAddressesStore';
import type { MainStackParamList } from '../../navigation/MainNavigator';
import {
  analyticsRideRequest,
  analyticsFeaturedRouteSelected,
  analyticsSavedAddressUsed,
  analyticsScreen,
} from '../../utils/analytics';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const GOING_RED    = '#ff4c41';

// ── Tipos de servicio ──────────────────────────────────────────────────────
const SERVICES = [
  { id: 'transport' as const, label: '🚙 Transporte', color: GOING_BLUE },
  { id: 'delivery'  as const, label: '📦 Envío',      color: '#E53935' },
  { id: 'tour'      as const, label: '🏔️ Tour',      color: '#43A047' },
];

// ── Ciudades de origen (rutas Going + Ecuador) ────────────────────────────
type CityId =
  | 'aeropuerto_quito' | 'quito' | 'guayaquil' | 'cuenca' | 'ambato' | 'riobamba'
  | 'loja' | 'manta' | 'portoviejo' | 'ibarra' | 'esmeraldas'
  | 'machala' | 'santo_domingo' | 'latacunga' | 'tulcan' | 'babahoyo'
  | 'lago_agrio' | 'tena' | 'puyo' | 'macas' | 'zamora' | 'guaranda'
  | 'banos' | 'el_carmen' | 'otavalo' | 'atuntaqui' | 'peguche'
  | 'salcedo' | 'pillaro' | 'cevallos' | 'tisaleo' | 'mocha' | 'la_concordia';

const ORIGIN_CITIES: { id: CityId; label: string; province: string }[] = [
  // ── Rutas Going (aeropuerto + Sierra principales) ──────────────────────
  { id: 'aeropuerto_quito', label: 'Aeropuerto Quito (Tababela)', province: 'Pichincha' },
  { id: 'quito',            label: 'Quito',                       province: 'Pichincha' },
  // ── Sierra Centro ──────────────────────────────────────────────────────
  { id: 'ambato',    label: 'Ambato',    province: 'Tungurahua' },
  { id: 'banos',     label: 'Baños',     province: 'Tungurahua' },
  { id: 'latacunga', label: 'Latacunga', province: 'Cotopaxi'   },
  { id: 'salcedo',   label: 'Salcedo',   province: 'Cotopaxi'   },
  { id: 'pillaro',   label: 'Píllaro',   province: 'Tungurahua' },
  { id: 'cevallos',  label: 'Cevallos',  province: 'Tungurahua' },
  { id: 'tisaleo',   label: 'Tisaleo',   province: 'Tungurahua' },
  { id: 'mocha',     label: 'Mocha',     province: 'Tungurahua' },
  // ── Sierra Norte ───────────────────────────────────────────────────────
  { id: 'ibarra',    label: 'Ibarra',    province: 'Imbabura' },
  { id: 'otavalo',   label: 'Otavalo',   province: 'Imbabura' },
  { id: 'atuntaqui', label: 'Atuntaqui', province: 'Imbabura' },
  { id: 'peguche',   label: 'Peguche',   province: 'Imbabura' },
  { id: 'tulcan',    label: 'Tulcán',    province: 'Carchi'   },
  // ── Costa / Santo Domingo ─────────────────────────────────────────────
  { id: 'el_carmen',    label: 'El Carmen',    province: 'Manabí'        },
  { id: 'la_concordia', label: 'La Concordia', province: 'Santo Domingo' },
  { id: 'santo_domingo',label: 'Santo Domingo',province: 'Santo Domingo' },
  // ── Resto Ecuador ─────────────────────────────────────────────────────
  { id: 'guayaquil',    label: 'Guayaquil',    province: 'Guayas'           },
  { id: 'cuenca',       label: 'Cuenca',       province: 'Azuay'            },
  { id: 'riobamba',     label: 'Riobamba',     province: 'Chimborazo'       },
  { id: 'loja',         label: 'Loja',         province: 'Loja'             },
  { id: 'manta',        label: 'Manta',        province: 'Manabí'           },
  { id: 'portoviejo',   label: 'Portoviejo',   province: 'Manabí'           },
  { id: 'esmeraldas',   label: 'Esmeraldas',   province: 'Esmeraldas'       },
  { id: 'machala',      label: 'Machala',      province: 'El Oro'           },
  { id: 'babahoyo',     label: 'Babahoyo',     province: 'Los Ríos'         },
  { id: 'lago_agrio',   label: 'Lago Agrio',   province: 'Sucumbíos'        },
  { id: 'tena',         label: 'Tena',         province: 'Napo'             },
  { id: 'puyo',         label: 'Puyo',         province: 'Pastaza'          },
  { id: 'macas',        label: 'Macas',        province: 'Morona Santiago'  },
  { id: 'zamora',       label: 'Zamora',       province: 'Zamora Chinchipe' },
  { id: 'guaranda',     label: 'Guaranda',     province: 'Bolívar'          },
];

// ── Zonas de destino dentro de Quito ──────────────────────────────────────────
export type QuitoZone = 'quito_norte' | 'quito_centro' | 'quito_sur' | 'valles' | 'aeropuerto';

export const QUITO_ZONES: { id: QuitoZone; label: string; surcharge: number; examples: string }[] = [
  { id: 'quito_norte',  label: 'Quito Norte',  surcharge: 0,  examples: 'La Y, Cotocollao, Carapungo, El Condado' },
  { id: 'quito_centro', label: 'Quito Centro', surcharge: 1,  examples: 'Centro Histórico, La Marín, El Ejido'    },
  { id: 'quito_sur',    label: 'Quito Sur',    surcharge: 1,  examples: 'El Recreo, Quitumbe, Guajaló'            },
  { id: 'valles',       label: 'Los Valles',   surcharge: 2,  examples: 'Cumbayá, Tumbaco, Sangolquí, Los Chillos'},
  { id: 'aeropuerto',   label: 'Aeropuerto',   surcharge: 15, examples: 'Tababela (Aeropuerto Internacional)'      },
];

// ── Rutas oficiales de Viaje Compartido Going ──────────────────────────────
// Rutas Going — IDA (hacia Quito) y VUELTA (desde Quito)
export const GOING_SHARED_ROUTES = [
  // ── IDA: ciudades → Quito ─────────────────────────────────────────────────
  {
    id:        'sierra_centro',
    label:     'Sierra Centro → Quito',
    icon:      '🏔️',
    direction: 'ida' as const,
    stops:     ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
    stopPrices:{ Riobamba: 17, Ambato: 10, Latacunga: 8 } as Record<string, number>,
  },
  {
    id:        'costa_quito',
    label:     'Costa → Quito',
    icon:      '🌊',
    direction: 'ida' as const,
    stops:     ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
    stopPrices:{ 'El Carmen': 14, 'La Concordia': 13, 'Santo Domingo': 11 } as Record<string, number>,
  },
  {
    id:        'sierra_norte',
    label:     'Sierra Norte → Quito',
    icon:      '🌿',
    direction: 'ida' as const,
    stops:     ['Ibarra', 'Otavalo', 'Quito'],
    stopPrices:{ Ibarra: 11, Otavalo: 9 } as Record<string, number>,
  },
  // ── VUELTA: Quito → ciudades (viajes de regreso del conductor) ────────────
  {
    id:        'quito_sierra_centro',
    label:     'Quito → Sierra Centro',
    icon:      '🏔️',
    direction: 'vuelta' as const,
    stops:     ['Quito', 'Latacunga', 'Ambato', 'Riobamba'],
    stopPrices:{ Quito: 10, Latacunga: 8, Ambato: 6 } as Record<string, number>,
  },
  {
    id:        'quito_costa',
    label:     'Quito → Costa',
    icon:      '🌊',
    direction: 'vuelta' as const,
    stops:     ['Quito', 'Santo Domingo', 'La Concordia', 'El Carmen'],
    stopPrices:{ Quito: 11, 'Santo Domingo': 8, 'La Concordia': 6 } as Record<string, number>,
  },
  {
    id:        'quito_sierra_norte',
    label:     'Quito → Sierra Norte',
    icon:      '🌿',
    direction: 'vuelta' as const,
    stops:     ['Quito', 'Otavalo', 'Ibarra'],
    stopPrices:{ Quito: 9, Otavalo: 6 } as Record<string, number>,
  },
];

/**
 * Calcula el precio de un asiento en viaje compartido.
 * @param originStop  Nombre de la parada de origen (ej: 'Ambato', 'Quito')
 * @param zone        Zona de destino dentro de Quito (aplica recargo)
 * @param frontSeat   +$3 si es asiento delantero
 * @param routeId     ID de ruta específica (opcional, mejora precisión)
 */
export function calcSharedSeatPrice(
  originStop: string,
  zone: QuitoZone = 'quito_norte',
  frontSeat = false,
  routeId?: string,
): number {
  const route = routeId
    ? GOING_SHARED_ROUTES.find(r => r.id === routeId)
    : GOING_SHARED_ROUTES.find(r => r.stopPrices[originStop] !== undefined);

  const base  = route?.stopPrices[originStop] ?? 10;
  // Recargo de zona solo aplica cuando el destino ES Quito
  const isDestinationQuito = route?.direction === 'ida' || !route;
  const surge = isDestinationQuito
    ? (QUITO_ZONES.find(z => z.id === zone)?.surcharge ?? 0)
    : 0;

  return base + surge + (frontSeat ? 3 : 0);
}

// ── Rutas destacadas (para el Home) ───────────────────────────────────────────
const FEATURED_ROUTES = [
  { id: 'r1', label: 'El Carmen → Sto. Domingo → Quito → Aeropuerto', color: '#ff4c41', icon: '✈️', badge: 'Popular'   },
  { id: 'r2', label: 'Riobamba → Ambato → Latacunga → Quito',         color: '#0033A0', icon: '🏔️', badge: 'Frecuente' },
  { id: 'r3', label: 'Ibarra → Otavalo → Quito → Aeropuerto',         color: '#43A047', icon: '🌿', badge: 'Rápida'    },
];

// ── Rutas recientes del usuario (persiste en AsyncStorage) ─────────────────
const RECENT_ROUTES_KEY = '@going:recent_routes_v1';
const MAX_RECENT = 4;

interface RecentRoute {
  id: string;
  origin: string;
  destination: string;
  originCity: CityId;
  vehicleType: VehicleId;
  tripMode: TripMode;
  price: number;
  ts: number; // timestamp
}

const loadRecentRoutes = async (): Promise<RecentRoute[]> => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_ROUTES_KEY);
    return raw ? (JSON.parse(raw) as RecentRoute[]) : [];
  } catch { return []; }
};

const saveRecentRoute = async (route: Omit<RecentRoute, 'id' | 'ts'>) => {
  try {
    const existing = await loadRecentRoutes();
    // Elimina duplicados exactos de mismo destino
    const deduped = existing.filter(r => r.destination !== route.destination);
    const updated: RecentRoute[] = [
      { ...route, id: `r_${Date.now()}`, ts: Date.now() },
      ...deduped,
    ].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(updated));
  } catch {}
};

// ── Tarifa base por persona según ciudad de origen ─────────────────────────
// SUV class: SUV, SUV XL  |  VAN class: VAN, VAN XL  |  BUS class: BUS
const PERSON_RATES: Record<CityId, { suv: number; van: number; bus: number }> = {
  // ── Rutas Going principales ────────────────────────────────────────────
  aeropuerto_quito: { suv: 12, van: 10, bus: 9  },
  quito:            { suv: 10, van: 8,  bus: 7  },
  // ── Sierra Centro ─────────────────────────────────────────────────────
  ambato:    { suv: 9,  van: 8,  bus: 7  },
  banos:     { suv: 12, van: 10, bus: 9  },
  latacunga: { suv: 8,  van: 7,  bus: 6  },
  salcedo:   { suv: 9,  van: 8,  bus: 7  },
  pillaro:   { suv: 10, van: 8,  bus: 7  },
  cevallos:  { suv: 10, van: 8,  bus: 7  },
  tisaleo:   { suv: 10, van: 8,  bus: 7  },
  mocha:     { suv: 11, van: 9,  bus: 8  },
  // ── Sierra Norte ──────────────────────────────────────────────────────
  ibarra:    { suv: 11, van: 9,  bus: 8  },
  otavalo:   { suv: 12, van: 10, bus: 9  },
  atuntaqui: { suv: 12, van: 10, bus: 9  },
  peguche:   { suv: 12, van: 10, bus: 9  },
  tulcan:    { suv: 18, van: 15, bus: 13 },
  // ── Costa / Santo Domingo ─────────────────────────────────────────────
  el_carmen:    { suv: 14, van: 12, bus: 10 },
  la_concordia: { suv: 13, van: 11, bus: 9  },
  santo_domingo:{ suv: 13, van: 11, bus: 9  },
  // ── Resto Ecuador ─────────────────────────────────────────────────────
  guayaquil:  { suv: 18, van: 15, bus: 13 },
  cuenca:     { suv: 20, van: 17, bus: 15 },
  riobamba:   { suv: 17, van: 14, bus: 12 },
  loja:       { suv: 25, van: 21, bus: 18 },
  manta:      { suv: 22, van: 18, bus: 16 },
  portoviejo: { suv: 22, van: 18, bus: 16 },
  esmeraldas: { suv: 20, van: 17, bus: 15 },
  machala:    { suv: 23, van: 19, bus: 17 },
  babahoyo:   { suv: 19, van: 16, bus: 14 },
  lago_agrio: { suv: 28, van: 24, bus: 20 },
  tena:       { suv: 25, van: 21, bus: 18 },
  puyo:       { suv: 22, van: 18, bus: 16 },
  macas:      { suv: 28, van: 24, bus: 20 },
  zamora:     { suv: 30, van: 25, bus: 22 },
  guaranda:   { suv: 18, van: 15, bus: 13 },
};

// ── Modos de viaje ─────────────────────────────────────────────────────────
type TripMode = 'compartido' | 'privado';

// ── Tipos de vehículo ──────────────────────────────────────────────────────
type VehicleId = 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'bus';

interface VehicleOption {
  id: VehicleId;
  label: string;
  desc: string;
  icon: string;
  capacity: number;
  availableIn: TripMode[];  // en qué modos está disponible
}

const VEHICLES: VehicleOption[] = [
  {
    id: 'suv',
    label: 'SUV',
    desc: '3 pasajeros',
    icon: 'car-sport-outline',
    capacity: 3,
    availableIn: ['compartido', 'privado'],
  },
  {
    id: 'suv_xl',
    label: 'SUV XL',
    desc: '5 pasajeros',
    icon: 'car-sport-outline',
    capacity: 5,
    availableIn: ['privado'],
  },
  {
    id: 'van',
    label: 'VAN',
    desc: '8 pasajeros',
    icon: 'bus-outline',
    capacity: 8,
    availableIn: ['compartido', 'privado'],
  },
  {
    id: 'van_xl',
    label: 'VAN XL',
    desc: '12 pasajeros',
    icon: 'bus-outline',
    capacity: 12,
    availableIn: ['privado'],
  },
  {
    id: 'bus',
    label: 'BUS',
    desc: '20+ pasajeros',
    icon: 'bus-outline',
    capacity: 20,
    availableIn: ['privado'],
  },
];

// ── Categorías ─────────────────────────────────────────────────────────────
type Category = 'confort' | 'premium' | 'empresa';

interface CategoryOption {
  id: Category;
  label: string;
  desc: string;
  multiplier: number;       // multiplicador sobre precio privado base
  onlyIn?: TripMode;        // si está definido, solo aparece en ese modo
}

const CATEGORIES: CategoryOption[] = [
  { id: 'confort',  label: 'Confort',  desc: 'Equipado y cómodo',            multiplier: 1.0 },
  { id: 'premium',  label: 'Premium',  desc: 'Lujo y servicio exclusivo',    multiplier: 1.5 },
  { id: 'empresa',  label: 'Empresa',  desc: '30% descuento · solo privado', multiplier: 0.7, onlyIn: 'privado' },
];

// ── Especificaciones de vehículo ───────────────────────────────────────────
const VEHICLE_SPECS: Record<VehicleId, { rateClass: 'suv' | 'van' | 'bus'; capacity: number }> = {
  suv:    { rateClass: 'suv', capacity: 3  },
  suv_xl: { rateClass: 'suv', capacity: 5  },
  van:    { rateClass: 'van', capacity: 8  },
  van_xl: { rateClass: 'van', capacity: 12 },
  bus:    { rateClass: 'bus', capacity: 20 },
};

/**
 * Calcula el precio según ciudad de origen, vehículo y modo:
 * - Compartido: tarifa por persona (pasajero paga su asiento)
 * - Privado:    tarifa por persona × capacidad del vehículo (precio del vehículo completo)
 */
const calcPrice = (city: CityId, vehicleId: VehicleId, mode: TripMode): number => {
  const rates = PERSON_RATES[city];
  const { rateClass, capacity } = VEHICLE_SPECS[vehicleId];
  const perPerson = rates[rateClass];
  return mode === 'compartido' ? perPerson : perPerson * capacity;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { addresses, loaded: addrLoaded, load: loadAddresses } = useSavedAddressesStore();

  useEffect(() => { if (!addrLoaded) loadAddresses(); }, []);

  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);
  useEffect(() => { loadRecentRoutes().then(setRecentRoutes); }, []);

  const [location, setLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState<'transport' | 'delivery' | 'tour'>('transport');
  const [originCity, setOriginCity] = useState<CityId>('quito');
  const [tripMode, setTripMode] = useState<TripMode>('compartido');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>('suv');
  const [selectedCategory, setSelectedCategory] = useState<Category>('confort');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // Vehículos filtrados según modo de viaje
  const availableVehicles = VEHICLES.filter(v => v.availableIn.includes(tripMode));

  // Categorías disponibles según el modo de viaje actual
  const availableCategories = CATEGORIES.filter(
    c => c.onlyIn === undefined || c.onlyIn === tripMode
  );

  // Analytics: track screen view on mount
  useEffect(() => { analyticsScreen('HomeScreen'); }, []);

  // Si el vehículo seleccionado no está disponible en el nuevo modo, resetear a SUV
  useEffect(() => {
    const isAvailable = availableVehicles.some(v => v.id === selectedVehicle);
    if (!isAvailable) setSelectedVehicle(availableVehicles[0]?.id ?? 'suv');
  }, [tripMode]);

  // Si la categoría seleccionada no aplica en el nuevo modo, resetear a confort
  useEffect(() => {
    const isAvailable = availableCategories.some(c => c.id === selectedCategory);
    if (!isAvailable) setSelectedCategory('confort');
  }, [tripMode]);

  // Precio calculado según ciudad de origen, vehículo, modo y categoría
  const basePrice = calcPrice(originCity, selectedVehicle, tripMode);
  const categoryMultiplier = CATEGORIES.find(c => c.id === selectedCategory)?.multiplier ?? 1;
  const finalPrice = basePrice * categoryMultiplier;

  const currentVehicle = VEHICLES.find(v => v.id === selectedVehicle)!;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation([loc.coords.longitude, loc.coords.latitude]);
      cameraRef.current?.setCamera({
        centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    })();
  }, []);

  // Geocodifica texto → coordenadas reales usando Mapbox
  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
      const query = encodeURIComponent(address);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=EC&limit=1&access_token=${token}`
      );
      const json = await res.json();
      const feature = json.features?.[0];
      if (!feature) return null;
      return { longitude: feature.center[0], latitude: feature.center[1] };
    } catch {
      return null;
    }
  };

  // Geocodificación inversa: coordenadas → dirección legible
  const reverseGeocode = async (lng: number, lat: number): Promise<string> => {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,place&limit=1&access_token=${token}`
      );
      const json = await res.json();
      return json.features?.[0]?.place_name ?? 'Mi ubicación';
    } catch {
      return 'Mi ubicación';
    }
  };

  const handleRideRequest = async () => {
    if (!destination.trim()) {
      hapticError();
      Alert.alert('Error', 'Por favor ingresa tu destino.');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Esperando tu ubicación…');
      return;
    }
    setLoading(true);
    try {
      // Geocodificar destino a coordenadas reales
      const destCoords = await geocodeAddress(destination);
      if (!destCoords) {
        Alert.alert('Destino no encontrado', 'No pudimos encontrar esa dirección. Intenta ser más específico.');
        setLoading(false);
        return;
      }

      // Obtener dirección legible del origen
      const originAddress = await reverseGeocode(location[0], location[1]);

      const originData = {
        latitude: location[1],
        longitude: location[0],
        address: originAddress,
      };
      const destData = {
        latitude: destCoords.latitude,
        longitude: destCoords.longitude,
        address: destination,
      };

      const { data } = await transportAPI.requestRide({
        userId: user?.id ?? '',
        origin: originData,
        destination: destData,
        vehicleType: selectedVehicle,
        tripMode,
        category: selectedCategory,
        originCity,
        price: { amount: finalPrice, currency: 'USD' },
      });

      // Guardar ruta reciente (no bloqueante)
      saveRecentRoute({
        origin: originAddress,
        destination,
        originCity,
        vehicleType: selectedVehicle,
        tripMode,
        price: finalPrice,
      }).then(() => loadRecentRoutes().then(setRecentRoutes));

      // Analytics
      analyticsRideRequest({
        origin_city: originCity,
        destination_city: destination.substring(0, 40),
        vehicle_type: selectedVehicle,
        estimated_price: finalPrice,
      });

      // Navegar a la pantalla de tracking en tiempo real
      navigation.navigate('ActiveRide', {
        rideId:       data?.id ?? data?.rideId ?? 'pending',
        origin:       originData,
        destination:  destData,
        vehicleType:  currentVehicle.label,
        tripMode,
        category:     selectedCategory,
        price:        finalPrice,
        pickupToken:  data?.pickupToken,
        shareUrl:     data?.shareUrl,
      });
    } catch {
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceCard = (service: 'compartido' | 'privado' | 'delivery') => {
    hapticMedium();
    if (service === 'compartido') {
      navigation.navigate('SharedRideBooking' as any, { originCity });
      return;
    }
    if (service === 'delivery') {
      navigation.navigate('Envios' as any);
      return;
    }
    // Privado — pantalla dedicada
    navigation.navigate('PrivateRideBooking' as any, { originCity });
  };

  const [showBookingSheet, setShowBookingSheet] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* ── FONDO: mapa o imagen según disponibilidad ── */}
      {location ? (
        <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={14}
            centerCoordinate={location ?? [-78.4678, -0.1807]}
            animationMode="flyTo"
          />
          <MapboxGL.UserLocation visible renderMode={MapboxGL.UserLocationRenderMode.Normal} />
        </MapboxGL.MapView>
      ) : (
        <Image
          source={require('../../../assets/home-bg.jpg')}
          style={styles.map}
          resizeMode="cover"
        />
      )}

      {/* Overlay degradado */}
      <View style={styles.mapOverlay} pointerEvents="none" />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../../assets/going-logo-horizontal.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => (navigation as any).openDrawer()}
          activeOpacity={0.8}
        >
          <Ionicons name="menu-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* ── GREETING ── */}
      <View style={styles.greetingArea} pointerEvents="none">
        <Text style={styles.greeting}>
          ¡Hola, {user?.firstName ?? 'viajero'}! 👋
        </Text>
        <Text style={styles.greetingSub}>¿A dónde viajamos hoy?</Text>
      </View>

      {/* ── SERVICE CARDS ── */}
      {!showBookingSheet && (
        <View style={styles.cardsArea}>
          {/* Buscador rápido */}
          <TouchableOpacity
            style={styles.quickSearch}
            onPress={() => setShowBookingSheet(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.quickSearchText}>Buscar destino...</Text>
          </TouchableOpacity>

          {/* Viaje Compartido */}
          <Pressable
            onPress={() => handleServiceCard('compartido')}
            style={({ pressed }) => [
              styles.serviceCard, styles.cardShared,
              pressed && [styles.serviceCardPressed, styles.cardSharedPressed],
            ]}
          >
            {({ pressed }) => (
              <>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>★ MÁS POPULAR</Text>
                </View>
                <View style={[styles.cardIcon, styles.iconShared]}>
                  <Ionicons name="people-outline" size={22} color={pressed ? 'rgba(100,149,255,0.9)' : GOING_BLUE} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>Viaje Compartido</Text>
                  <Text style={[styles.cardSub, pressed && styles.cardSubPressed]}>Paga solo tu asiento · SUV o VAN</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={pressed ? 'rgba(255,255,255,0.35)' : '#D1D5DB'} />
              </>
            )}
          </Pressable>

          {/* Viaje Privado */}
          <Pressable
            onPress={() => handleServiceCard('privado')}
            style={({ pressed }) => [
              styles.serviceCard, styles.cardPrivate,
              pressed && [styles.serviceCardPressed, styles.cardPrivatePressed],
            ]}
          >
            {({ pressed }) => (
              <>
                <View style={[styles.cardIcon, styles.iconPrivate]}>
                  <Ionicons name="lock-closed-outline" size={22} color={pressed ? 'rgba(255,120,120,0.9)' : '#C0101A'} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>Viaje Privado</Text>
                  <Text style={[styles.cardSub, pressed && styles.cardSubPressed]}>Vehículo exclusivo · horario lo pones tú</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={pressed ? 'rgba(255,255,255,0.35)' : '#D1D5DB'} />
              </>
            )}
          </Pressable>

          {/* Envíos */}
          <Pressable
            onPress={() => handleServiceCard('delivery')}
            style={({ pressed }) => [
              styles.serviceCard, styles.cardDelivery,
              pressed && [styles.serviceCardPressed, styles.cardDeliveryPressed],
            ]}
          >
            {({ pressed }) => (
              <>
                <View style={[styles.cardIcon, styles.iconDelivery]}>
                  <Ionicons name="cube-outline" size={22} color={pressed ? 'rgba(80,200,140,0.9)' : '#059669'} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>Envíos</Text>
                  <Text style={[styles.cardSub, pressed && styles.cardSubPressed]}>De punto a punto · Rastreo · Registro de entrega</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={pressed ? 'rgba(255,255,255,0.35)' : '#D1D5DB'} />
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* ── BOOKING SHEET eliminado: cada tarjeta navega a su propia pantalla ── */}
      {showBookingSheet && false && (
        <View style={styles.card}>
        <Text style={styles.greeting}>
          ¡Hola, {user?.firstName ?? 'viajero'}! 👋
        </Text>

        {/* Service selector */}
        <View style={styles.serviceRow}>
          {SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[
                styles.serviceBtn,
                selectedService === svc.id && { backgroundColor: svc.color, borderColor: svc.color },
              ]}
              onPress={() => setSelectedService(svc.id)}
            >
              <Text
                style={[
                  styles.serviceBtnText,
                  selectedService === svc.id && { color: '#fff' },
                ]}
              >
                {svc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Selector de transporte (solo si es transporte) ── */}
        {selectedService === 'transport' && (
          <>
            {/* 0. Ciudad de origen */}
            <Text style={styles.sectionLabel}>¿Desde dónde sales?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cityScroll}
              contentContainerStyle={styles.cityScrollContent}
            >
              {ORIGIN_CITIES.map((city) => {
                const active = originCity === city.id;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => { hapticLight(); setOriginCity(city.id); }}
                  >
                    <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                      {city.label}
                    </Text>
                    <Text style={[styles.cityChipSub, active && { color: 'rgba(255,255,255,0.7)' }]}>
                      {city.province}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 1a. Mis rutas recientes (si las hay) */}
            {recentRoutes.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>MIS ÚLTIMAS RUTAS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.routeScroll}
                  contentContainerStyle={styles.routeScrollContent}
                >
                  {recentRoutes.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.routeCard, styles.recentRouteCard]}
                      onPress={() => {
                        hapticLight();
                        setDestination(r.destination);
                        setOriginCity(r.originCity);
                        setSelectedVehicle(r.vehicleType);
                        setTripMode(r.tripMode);
                      }}
                    >
                      <View style={[styles.routeIconBg, { backgroundColor: '#0033A012' }]}>
                        <Ionicons name="time-outline" size={18} color={GOING_BLUE} />
                      </View>
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel} numberOfLines={1}>{r.destination}</Text>
                        <Text style={styles.recentRouteSub} numberOfLines={1}>
                          {r.tripMode === 'compartido' ? 'Compartido' : 'Privado'} · ${r.price.toFixed(0)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* 1b. Rutas destacadas */}
            <Text style={styles.sectionLabel}>RUTAS FRECUENTES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routeScroll}
              contentContainerStyle={styles.routeScrollContent}
            >
              {FEATURED_ROUTES.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeCard}
                  onPress={() => {
                    analyticsFeaturedRouteSelected(route.label);
                    setDestination(route.label.split(' → ').pop() ?? '');
                  }}
                >
                  <View style={[styles.routeIconBg, { backgroundColor: `${route.color}18` }]}>
                    <Text style={styles.routeIcon}>{route.icon}</Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeLabel} numberOfLines={1}>{route.label}</Text>
                    <View style={[styles.routeBadge, { backgroundColor: route.color }]}>
                      <Text style={styles.routeBadgeText}>{route.badge}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 1. Modo de viaje: Compartido / Privado */}
            <View style={styles.modeRow}>
              {(['compartido', 'privado'] as TripMode[]).map((mode) => {
                const active = tripMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                    onPress={() => { hapticLight(); setTripMode(mode); }}
                  >
                    <Ionicons
                      name={mode === 'compartido' ? 'people-outline' : 'person-outline'}
                      size={16}
                      color={active ? '#fff' : '#6B7280'}
                    />
                    <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
                      {mode === 'compartido' ? 'Compartido' : 'Privado'}
                    </Text>
                    {mode === 'compartido' && (
                      <Text style={[styles.modeBtnHint, active && { color: 'rgba(255,255,255,0.7)' }]}>
                        Cada hora
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Tipo de vehículo */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.vehicleScroll}
              contentContainerStyle={styles.vehicleScrollContent}
            >
              {availableVehicles.map((vt) => {
                const active = selectedVehicle === vt.id;
                const price = calcPrice(originCity, vt.id, tripMode) * categoryMultiplier;
                return (
                  <TouchableOpacity
                    key={vt.id}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                    onPress={() => { hapticLight(); setSelectedVehicle(vt.id); }}
                  >
                    <Ionicons
                      name={vt.icon as any}
                      size={24}
                      color={active ? GOING_BLUE : '#999'}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={[styles.vehicleLabel, active && styles.vehicleLabelActive]}>
                      {vt.label}
                    </Text>
                    <Text style={styles.vehicleDesc}>{vt.desc}</Text>
                    <Text style={[styles.vehiclePrice, active && styles.vehiclePriceActive]}>
                      ${price.toFixed(2)}
                    </Text>
                    {active && (
                      <View style={styles.vehicleCheck}>
                        <Ionicons name="checkmark-circle" size={16} color={GOING_BLUE} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. Categoría: Confort / Premium / Empresa */}
            <View style={styles.categoryRow}>
              {availableCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                const iconName = cat.id === 'premium'
                  ? 'diamond-outline'
                  : cat.id === 'empresa'
                  ? 'business-outline'
                  : 'shield-checkmark-outline';
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBtn, active && styles.categoryBtnActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <View style={styles.categoryHeader}>
                      <Ionicons
                        name={iconName}
                        size={14}
                        color={active ? GOING_BLUE : '#9CA3AF'}
                      />
                      <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                        {cat.label}
                      </Text>
                    </View>
                    <Text style={styles.categoryDesc}>{cat.desc}</Text>
                    {cat.id === 'premium' && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>+50%</Text>
                      </View>
                    )}
                    {cat.id === 'empresa' && (
                      <View style={styles.empresaBadge}>
                        <Text style={styles.empresaText}>-30%</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Accesos rapidos — direcciones guardadas */}
        {addresses.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ACCESOS RAPIDOS</Text>
            <View style={styles.quickRow}>
              {addresses.slice(0, 3).map(addr => {
                const iconMap = { home: 'home', work: 'briefcase', favorite: 'heart' } as const;
                const colorMap: Record<string, string> = { home: '#0033A0', work: '#059669', favorite: '#ff4c41' };
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={styles.quickBtn}
                    onPress={() => { hapticLight(); analyticsSavedAddressUsed(addr.type); setDestination(addr.address); }}
                  >
                    <Ionicons name={iconMap[addr.type]} size={14} color={colorMap[addr.type]} />
                    <Text style={styles.quickBtnText} numberOfLines={1}>{addr.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Destination input */}
        <TextInput
          style={styles.input}
          placeholder="¿A dónde vas?"
          placeholderTextColor="#999"
          value={destination}
          onChangeText={setDestination}
          returnKeyType="search"
        />

        {/* Request button */}
        <TouchableOpacity
          style={[styles.requestBtn, loading && { opacity: 0.7 }]}
          onPress={() => { hapticMedium(); handleRideRequest(); }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.requestBtnInner}>
              <Text style={styles.requestBtnText}>
                {selectedService === 'transport'
                  ? `Solicitar ${currentVehicle.label} ${tripMode === 'compartido' ? 'Compartido' : 'Privado'}`
                  : selectedService === 'delivery'
                  ? 'Enviar paquete'
                  : 'Buscar tour'}
              </Text>
              {selectedService === 'transport' && (
                <Text style={styles.requestBtnPrice}>
                  {selectedCategory === 'premium' ? '★ Premium · ' : ''}
                  ${finalPrice.toFixed(2)} {tripMode === 'compartido' ? 'por persona' : 'vehículo completo'}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

          {/* Botón cerrar booking sheet */}
          <TouchableOpacity
            style={styles.closeSheet}
            onPress={() => setShowBookingSheet(false)}
          >
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  // Overlay degradado sobre el mapa/foto
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(10,15,35,0.82) 100%)',
  },

  // Greeting
  greetingArea: {
    position: 'absolute',
    bottom: 340,
    left: 20, right: 20,
    zIndex: 5,
  },
  greetingSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },

  // Cards area
  cardsArea: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 12,
    paddingBottom: 34,
    zIndex: 5,
    gap: 10,
  },

  // Quick search
  quickSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 13,
    marginBottom: 2,
  },
  quickSearchText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    flex: 1,
  },

  // Service cards — blancas por defecto
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 16,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  // Estado presionado — transparente
  serviceCardPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardShared:  { borderLeftWidth: 4, borderLeftColor: GOING_BLUE },
  cardPrivate: { borderLeftWidth: 4, borderLeftColor: '#C0101A'  },
  cardDelivery:{ borderLeftWidth: 4, borderLeftColor: '#059669'  },
  cardSharedPressed:  { borderLeftWidth: 0 },
  cardPrivatePressed: { borderLeftWidth: 0 },
  cardDeliveryPressed:{ borderLeftWidth: 0 },
  cardIcon: {
    width: 44, height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconShared:   { backgroundColor: 'rgba(0,51,160,0.08)'   },
  iconPrivate:  { backgroundColor: 'rgba(192,16,26,0.08)'  },
  iconDelivery: { backgroundColor: 'rgba(5,150,105,0.08)'  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  cardTitlePressed: { color: '#fff' },
  cardSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 15,
  },
  cardSubPressed: { color: 'rgba(255,255,255,0.60)' },
  popularBadge: {
    position: 'absolute',
    top: 0, right: 14,
    backgroundColor: GOING_YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '900',
    color: GOING_BLUE,
    letterSpacing: 0.3,
  },

  // Booking sheet close btn
  closeSheet: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },

  // Top bar flotante sobre el mapa
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topBarLogo: {
    width: 120,
    height: 55,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  userMarker: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: GOING_BLUE, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  userMarkerInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  card: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 12,
  },
  greeting: { fontSize: 22, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },

  // Service row
  serviceRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  serviceBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center',
  },
  serviceBtnText: { fontSize: 13, fontWeight: '600', color: '#444' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 6, letterSpacing: 0.5 },

  // City selector
  cityScroll: { marginBottom: 10, marginHorizontal: -4 },
  cityScrollContent: { gap: 8, paddingHorizontal: 4 },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cityChipActive: { backgroundColor: GOING_BLUE, borderColor: GOING_BLUE },
  cityChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  cityChipTextActive: { color: '#fff' },
  cityChipSub: { fontSize: 9, color: '#9CA3AF', fontWeight: '500', marginTop: 1 },

  // Trip mode (Compartido / Privado)
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  modeBtnActive: {
    backgroundColor: GOING_BLUE, borderColor: GOING_BLUE,
  },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  modeBtnTextActive: { color: '#fff' },
  modeBtnHint: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  // Vehicle selector
  vehicleScroll: { marginBottom: 10, marginHorizontal: -4 },
  vehicleScrollContent: { gap: 8, paddingHorizontal: 4 },
  vehicleCard: {
    width: 100, padding: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  vehicleCardActive: {
    borderColor: GOING_BLUE, backgroundColor: `${GOING_BLUE}08`,
  },
  vehicleLabel: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 1 },
  vehicleLabelActive: { color: GOING_BLUE },
  vehicleDesc: { fontSize: 9, color: '#9CA3AF', marginBottom: 4 },
  vehiclePrice: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  vehiclePriceActive: { color: GOING_BLUE },
  vehicleCheck: { position: 'absolute', top: 6, right: 6 },

  // Category (Confort / Premium)
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryBtn: {
    flex: 1, padding: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  categoryBtnActive: {
    borderColor: GOING_BLUE, backgroundColor: `${GOING_BLUE}08`,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  categoryLabel: { fontSize: 13, fontWeight: '800', color: '#374151' },
  categoryLabelActive: { color: GOING_BLUE },
  categoryDesc: { fontSize: 10, color: '#9CA3AF' },
  premiumBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: GOING_YELLOW, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  premiumText: { fontSize: 8, fontWeight: '800', color: GOING_BLUE },
  empresaBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#059669', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  empresaText: { fontSize: 8, fontWeight: '800', color: '#fff' },

  // Featured routes
  routeScroll: { marginBottom: 12, marginHorizontal: -4 },
  routeScrollContent: { gap: 8, paddingHorizontal: 4 },
  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#F3F4F6', backgroundColor: '#fff',
    minWidth: 240,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  routeIconBg: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  routeIcon: { fontSize: 18 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  routeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  routeBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  recentRouteCard: { borderWidth: 1.5, borderColor: '#E8EDF8', backgroundColor: '#F8FAFF' },
  recentRouteSub:  { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  // Quick address shortcuts
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  quickBtnText: { fontSize: 12, fontWeight: '700', color: '#374151', flex: 1 },

  // Input
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#222', marginBottom: 12, backgroundColor: '#f9f9f9',
  },

  // Request button
  requestBtn: {
    backgroundColor: GOING_BLUE, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: GOING_BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  requestBtnInner: { alignItems: 'center' },
  requestBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  requestBtnPrice: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 2 },
});
