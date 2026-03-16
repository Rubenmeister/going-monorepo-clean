import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/useAuthStore';
import { transportAPI } from '../../services/api';
import type { MainStackParamList } from '../../navigation/MainNavigator';

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

// ── Ciudades de origen (21 ciudades Ecuador) ───────────────────────────────
type CityId =
  | 'quito' | 'guayaquil' | 'cuenca' | 'ambato' | 'riobamba'
  | 'loja' | 'manta' | 'portoviejo' | 'ibarra' | 'esmeraldas'
  | 'machala' | 'santo_domingo' | 'latacunga' | 'tulcan' | 'babahoyo'
  | 'lago_agrio' | 'tena' | 'puyo' | 'macas' | 'zamora' | 'guaranda';

const ORIGIN_CITIES: { id: CityId; label: string; province: string }[] = [
  { id: 'quito',        label: 'Quito',         province: 'Pichincha' },
  { id: 'guayaquil',    label: 'Guayaquil',      province: 'Guayas' },
  { id: 'cuenca',       label: 'Cuenca',         province: 'Azuay' },
  { id: 'ambato',       label: 'Ambato',         province: 'Tungurahua' },
  { id: 'riobamba',     label: 'Riobamba',       province: 'Chimborazo' },
  { id: 'loja',         label: 'Loja',           province: 'Loja' },
  { id: 'manta',        label: 'Manta',          province: 'Manabí' },
  { id: 'portoviejo',   label: 'Portoviejo',     province: 'Manabí' },
  { id: 'ibarra',       label: 'Ibarra',         province: 'Imbabura' },
  { id: 'esmeraldas',   label: 'Esmeraldas',     province: 'Esmeraldas' },
  { id: 'machala',      label: 'Machala',        province: 'El Oro' },
  { id: 'santo_domingo',label: 'Santo Domingo',  province: 'Santo Domingo' },
  { id: 'latacunga',    label: 'Latacunga',      province: 'Cotopaxi' },
  { id: 'tulcan',       label: 'Tulcán',         province: 'Carchi' },
  { id: 'babahoyo',     label: 'Babahoyo',       province: 'Los Ríos' },
  { id: 'lago_agrio',   label: 'Lago Agrio',     province: 'Sucumbíos' },
  { id: 'tena',         label: 'Tena',           province: 'Napo' },
  { id: 'puyo',         label: 'Puyo',           province: 'Pastaza' },
  { id: 'macas',        label: 'Macas',          province: 'Morona Santiago' },
  { id: 'zamora',       label: 'Zamora',         province: 'Zamora Chinchipe' },
  { id: 'guaranda',     label: 'Guaranda',       province: 'Bolívar' },
];

// ── Rutas destacadas ───────────────────────────────────────────────────────
const FEATURED_ROUTES = [
  { id: 'r1', label: 'Santo Domingo → Quito → Aeropuerto', color: '#ff4c41', icon: '✈️', badge: 'Popular' },
  { id: 'r2', label: 'Ambato → Latacunga → Quito',         color: '#0033A0', icon: '🔵', badge: 'Frecuente' },
  { id: 'r3', label: 'Ibarra → Quito → Aeropuerto',        color: '#43A047', icon: '🟢', badge: 'Rápida' },
  { id: 'r4', label: 'Cuenca → Loja → Zamora',             color: '#F59E0B', icon: '🏔️', badge: 'Turismo' },
];

// ── Tarifa base por persona según ciudad de origen ─────────────────────────
// SUV class: SUV, SUV XL  |  VAN class: VAN, VAN XL  |  BUS class: BUS
const PERSON_RATES: Record<CityId, { suv: number; van: number; bus: number }> = {
  quito:         { suv: 10, van: 8,  bus: 7  },
  guayaquil:     { suv: 18, van: 15, bus: 13 },
  cuenca:        { suv: 20, van: 17, bus: 15 },
  ambato:        { suv: 15, van: 13, bus: 11 },
  riobamba:      { suv: 17, van: 14, bus: 12 },
  loja:          { suv: 25, van: 21, bus: 18 },
  manta:         { suv: 22, van: 18, bus: 16 },
  portoviejo:    { suv: 22, van: 18, bus: 16 },
  ibarra:        { suv: 15, van: 13, bus: 11 },
  esmeraldas:    { suv: 20, van: 17, bus: 15 },
  machala:       { suv: 23, van: 19, bus: 17 },
  santo_domingo: { suv: 15, van: 13, bus: 11 },
  latacunga:     { suv: 13, van: 11, bus: 10 },
  tulcan:        { suv: 18, van: 15, bus: 13 },
  babahoyo:      { suv: 19, van: 16, bus: 14 },
  lago_agrio:    { suv: 28, van: 24, bus: 20 },
  tena:          { suv: 25, van: 21, bus: 18 },
  puyo:          { suv: 22, van: 18, bus: 16 },
  macas:         { suv: 28, van: 24, bus: 20 },
  zamora:        { suv: 30, van: 25, bus: 22 },
  guaranda:      { suv: 18, van: 15, bus: 13 },
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
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState<'transport' | 'delivery' | 'tour'>('transport');
  const [originCity, setOriginCity] = useState<CityId>('latacunga');
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

      // Navegar a la pantalla de tracking en tiempo real
      navigation.navigate('ActiveRide', {
        rideId: data?.id ?? data?.rideId ?? 'pending',
        origin: originData,
        destination: destData,
        vehicleType: currentVehicle.label,
        tripMode,
        category: selectedCategory,
        price: finalPrice,
      });
    } catch {
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── MAP ── */}
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={location ?? [-78.4678, -0.1807]}
          animationMode="flyTo"
        />
        {location && (
          <MapboxGL.PointAnnotation id="user-location" coordinate={location}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
        <MapboxGL.UserLocation
          visible
          renderMode={MapboxGL.UserLocationRenderMode.Normal}
        />
      </MapboxGL.MapView>

      {/* ── BOTTOM CARD ── */}
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
                    onPress={() => setOriginCity(city.id)}
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
                  onPress={() => setDestination(route.label.split(' → ').pop() ?? '')}
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
                    onPress={() => setTripMode(mode)}
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
                    onPress={() => setSelectedVehicle(vt.id)}
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
          onPress={handleRideRequest}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  greeting: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 14 },

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
