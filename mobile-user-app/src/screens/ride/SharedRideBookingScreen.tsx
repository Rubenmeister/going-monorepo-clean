/**
 * SharedRideBookingScreen — Reserva de Viaje Compartido
 *
 * Flujo:
 *  1. Origen pre-llenado desde historial · Destino con rutas frecuentes
 *  2. Fecha y hora de salida
 *  3. Vehículo asignado automáticamente (SUV · máx 3 pasajeros)
 *  4. Upsell asiento delantero (+$3)
 *  5. "Ver otras salidas hoy" colapsable
 *  6. Promo regreso + Going Points
 *  → Al tocar un horario → ConfirmRideScreen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import {
  GOING_SHARED_ROUTES,
  QUITO_ZONES,
  calcSharedSeatPrice,
  type QuitoZone,
} from '../home/HomeScreen';
import type { LocationResult } from '../shared/LocationPickerScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Colores — Compartido usa paleta VERDE ─────────────────────────────────────
const BLUE    = '#0033A0';   // azul Going (acento secundario)
const YELLOW  = '#FFCD00';
const GREEN   = '#059669';   // verde principal
const DARK_GREEN = '#065F46'; // verde oscuro para textos
const PASTEL  = '#D1FAE5';   // verde pastel header
const GREEN_BORDER = '#6EE7B7'; // borde verde suave

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type SharedRideBookingParams = {
  originStop?:      string;    // parada de origen: 'Ambato', 'Ibarra', 'Quito', etc.
  routeId?:         string;    // ruta pre-seleccionada
  preselectedZone?: QuitoZone;
};

interface AvailableTrip {
  id:       string;
  time:     string;
  origin:   string;
  dest:     string;
  seatsLeft: number;
  price:    number;
}

// ── Horarios demo (luego vendrán de la API) ───────────────────────────────────
const DEMO_TRIPS: AvailableTrip[] = [
  { id: 't1', time: '06:00', origin: 'Quito', dest: 'Destino', seatsLeft: 3, price: 10 },
  { id: 't2', time: '08:30', origin: 'Quito', dest: 'Destino', seatsLeft: 2, price: 10 },
  { id: 't3', time: '10:00', origin: 'Quito', dest: 'Destino', seatsLeft: 1, price: 10 },
  { id: 't4', time: '13:00', origin: 'Quito', dest: 'Destino', seatsLeft: 3, price: 9  },
];

const RECENT_KEY = '@going:recent_routes_v1';

// ─────────────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function SharedRideBookingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: SharedRideBookingParams }, 'params'>>();
  const { user }   = useAuthStore();

  // originStop = parada donde sube el pasajero (ej: 'Ambato', 'Quito')
  const [originCity,   setOriginCity]   = useState(route.params?.originStop ?? 'Quito');
  const [selectedRoute, setSelectedRoute] = useState(
    route.params?.routeId
      ? GOING_SHARED_ROUTES.find(r => r.id === route.params?.routeId)
      : GOING_SHARED_ROUTES.find(r => r.stopPrices[route.params?.originStop ?? 'Quito'] !== undefined)
        ?? GOING_SHARED_ROUTES[0]
  );
  const [destination,  setDestination]  = useState(
    // Auto-fill destino según la ruta y parada
    selectedRoute?.stops[selectedRoute.stops.length - 1] ?? ''
  );
  const [destCoords,   setDestCoords]   = useState<{ lat: number; lng: number } | null>(null);

  // Recibir ubicación seleccionada en el LocationPicker
  React.useEffect(() => {
    const loc: LocationResult | undefined = (route.params as any)?.selectedDestination;
    if (loc) {
      setDestination(loc.address);
      setDestCoords({ lat: loc.latitude, lng: loc.longitude });
    }
  }, [(route.params as any)?.selectedDestination]);
  const [selectedZone, setSelectedZone] = useState<QuitoZone>(route.params?.preselectedZone ?? 'quito_norte');
  const [date,         setDate]         = useState(new Date());
  const [frontSeat,    setFrontSeat]    = useState(false);
  const [showTrips,    setShowTrips]    = useState(false);
  const [recentDests,  setRecentDests]  = useState<string[]>([]);
  const [showZonePicker, setShowZonePicker] = useState(false);

  const pricePerSeat = calcSharedSeatPrice(originCity, selectedZone, frontSeat, selectedRoute?.id);
  const today        = date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });

  // Cargar destinos recientes
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (!raw) return;
      const routes = JSON.parse(raw) as any[];
      const dests = [...new Set(routes.map(r => r.destination))].slice(0, 3);
      setRecentDests(dests);
    }).catch(() => {});
  }, []);

  const toggleTrips = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    hapticLight();
    setShowTrips(prev => !prev);
  };

  const handleSelectTrip = (trip: AvailableTrip) => {
    hapticMedium();
    if (!destination) {
      Alert.alert('Destino requerido', 'Por favor selecciona un destino antes de continuar.');
      return;
    }
    navigation.navigate('ConfirmRide' as any, {
      type:          'compartido',
      tripId:        trip.id,
      origin:        originCity,
      destination,
      departureTime: trip.time,
      date:          date.toISOString(),
      vehicle:       'SUV',
      pricePerSeat:  pricePerSeat,
      frontSeat,
      zone:          selectedZone,
    });
  };

  const zoneSurcharge = QUITO_ZONES.find(z => z.id === selectedZone)?.surcharge ?? 0;
  const zoneLabel     = QUITO_ZONES.find(z => z.id === selectedZone)?.label ?? 'Quito Norte';

  return (
    <View style={styles.container}>

      {/* ── HEADER azul pastel ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={BLUE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Viaje Compartido</Text>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>★ MÁS POPULAR</Text>
          </View>
        </View>

        {/* Selector de ruta */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotOrigin]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>ORIGEN</Text>
              <Text style={styles.routeValue}>{originCity}</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Cambiar origen', 'Próximamente: selector de ciudad de origen.')}>
              <Text style={styles.routeChange}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotDest]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>DESTINO EN QUITO</Text>
              <TextInput
                style={styles.destInput}
                placeholder="¿A dónde vas?"
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={setDestination}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity onPress={() => {
              navigation.navigate('LocationPicker' as any, {
                title:        'Destino en Quito',
                mode:         'destination',
                accentColor:  GREEN,
                returnScreen: 'SharedRideBooking',
                paramKey:     'selectedDestination',
              });
            }}>
              <Text style={styles.routeChange}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Zone picker */}
        {showZonePicker && (
          <View style={styles.zonePicker}>
            {QUITO_ZONES.map(z => (
              <TouchableOpacity
                key={z.id}
                style={[styles.zoneOption, selectedZone === z.id && styles.zoneOptionActive]}
                onPress={() => { setSelectedZone(z.id); setShowZonePicker(false); hapticLight(); }}
              >
                <Text style={[styles.zoneLabel, selectedZone === z.id && { color: '#fff' }]}>
                  {z.label}
                </Text>
                <Text style={[styles.zoneSurcharge, selectedZone === z.id && { color: 'rgba(255,255,255,0.8)' }]}>
                  {z.surcharge === 0 ? 'Base' : `+$${z.surcharge}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Rutas recientes */}
        {recentDests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MIS DESTINOS FRECUENTES</Text>
            <View style={styles.chipsRow}>
              {recentDests.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => { setDestination(d); hapticLight(); }}
                >
                  <Ionicons name="time-outline" size={13} color={BLUE} />
                  <Text style={styles.chipText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Fecha y hora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FECHA Y HORA DE SALIDA</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn}>
              <Text style={styles.dateBtnIcon}>📅</Text>
              <View>
                <Text style={styles.dateLbl}>FECHA</Text>
                <Text style={styles.dateVal}>{today}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn}>
              <Text style={styles.dateBtnIcon}>🕐</Text>
              <View>
                <Text style={styles.dateLbl}>HORA</Text>
                <Text style={styles.dateVal}>08:00 AM</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehículo asignado con foto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TU VEHÍCULO</Text>
          <View style={styles.vehicleCard}>
            <Image
              source={require('../../../assets/1. uv.jpg')}
              style={styles.vehicleThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>SUV</Text>
              <Text style={styles.vehicleDesc}>Máximo 3 pasajeros · Equipaje incluido</Text>
              <Text style={styles.vehiclePrice}>${pricePerSeat.toFixed(2)} / asiento</Text>
            </View>
          </View>
        </View>

        {/* Upsell asiento delantero */}
        <TouchableOpacity
          style={[styles.upsell, frontSeat && styles.upsellActive]}
          onPress={() => { setFrontSeat(p => !p); hapticLight(); }}
          activeOpacity={0.85}
        >
          <Image
            source={require('../../../assets/interior SUV.jpg')}
            style={styles.upsellThumb}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.upsellTitle}>
              {frontSeat ? '✓ ' : ''}🪑 Asiento delantero
            </Text>
            <Text style={styles.upsellSub}>Mayor espacio y mejor vista del paisaje andino</Text>
          </View>
          <Text style={styles.upsellPrice}>+$3.00</Text>
        </TouchableOpacity>

        {/* Otras salidas — colapsable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HORARIOS DISPONIBLES</Text>
          <TouchableOpacity style={styles.tripsToggle} onPress={toggleTrips} activeOpacity={0.85}>
            <View style={styles.tripsToggleIcon}>
              <Ionicons name="time-outline" size={20} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripsToggleTitle}>Ver otras salidas hoy</Text>
              <Text style={styles.tripsToggleSub}>
                {showTrips ? 'Toca un horario para continuar' : `${DEMO_TRIPS.length} viajes disponibles`}
              </Text>
            </View>
            <Ionicons
              name={showTrips ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={BLUE}
            />
          </TouchableOpacity>

          {showTrips && (
            <View style={styles.tripsList}>
              {DEMO_TRIPS.map(trip => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripItem}
                  onPress={() => handleSelectTrip(trip)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.tripTime}>{trip.time}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripRoute}>{originCity} → {destination || 'Destino'}</Text>
                    <Text style={styles.tripSeats}>{trip.seatsLeft} asiento{trip.seatsLeft !== 1 ? 's' : ''} libre{trip.seatsLeft !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={[
                    styles.seatsBadge,
                    trip.seatsLeft === 1 ? styles.seatsBadgeFew : styles.seatsBadgeOk
                  ]}>
                    <Text style={[
                      styles.seatsBadgeText,
                      trip.seatsLeft === 1 ? { color: '#92400E' } : { color: GREEN }
                    ]}>
                      {trip.seatsLeft} libre{trip.seatsLeft !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.tripPrice}>${trip.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Promo regreso */}
        <TouchableOpacity style={styles.returnPromo} activeOpacity={0.85}>
          <Text style={styles.returnPromoIcon}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.returnPromoTitle}>¡Reserva tu regreso y gana puntos!</Text>
            <Text style={styles.returnPromoSub}>Suma Going Points en tu viaje de vuelta</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+50 pts</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },

  // Header
  header: {
    backgroundColor: PASTEL,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GREEN_BORDER,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(5,150,105,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: DARK_GREEN, flex: 1 },
  popularBadge: {
    backgroundColor: GREEN,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  popularText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Route card
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 11,
  },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  dotOrigin: { backgroundColor: GREEN },
  dotDest: { backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#9CA3AF' },
  routeLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  routeValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  routeChange: { fontSize: 11, fontWeight: '700', color: GREEN },
  routeDivider: { height: 1, backgroundColor: '#D1FAE5', marginLeft: 22 },
  destInput: { fontSize: 14, fontWeight: '600', color: '#111827', padding: 0, minWidth: 150 },

  // Zone picker
  zonePicker: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    overflow: 'hidden',
  },
  zoneOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  zoneOptionActive: { backgroundColor: GREEN },
  zoneLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  zoneSurcharge: { fontSize: 12, fontWeight: '800', color: '#6B7280' },

  // Content
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },

  // Recientes
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: GREEN_BORDER,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: GREEN },

  // Fecha
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 13,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  dateBtnIcon: { fontSize: 18 },
  dateLbl: { fontSize: 9, color: '#9CA3AF', fontWeight: '700' },
  dateVal: { fontSize: 13, fontWeight: '800', color: '#111827', marginTop: 1 },

  // Vehículo
  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1.5, borderColor: GREEN_BORDER,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  vehicleThumb: { width: 72, height: 72, borderRadius: 12 },
  vehicleName: { fontSize: 15, fontWeight: '900', color: DARK_GREEN },
  vehicleDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  vehiclePrice: { fontSize: 13, fontWeight: '900', color: GREEN, marginTop: 6 },

  // Upsell
  upsell: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#FDE68A',
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
  },
  upsellActive: { backgroundColor: '#FEF9C3', borderColor: '#F59E0B' },
  upsellThumb: { width: 64, height: 64, borderRadius: 12 },
  upsellTitle: { fontSize: 13, fontWeight: '900', color: '#92400E' },
  upsellSub: { fontSize: 10, color: '#B45309', marginTop: 3 },
  upsellPrice: { fontSize: 16, fontWeight: '900', color: '#92400E' },

  // Trips toggle
  tripsToggle: {
    backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1.5, borderColor: GREEN,
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 2,
  },
  tripsToggleIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  tripsToggleTitle: { fontSize: 13, fontWeight: '800', color: DARK_GREEN },
  tripsToggleSub: { fontSize: 10, color: '#6B7280', marginTop: 2 },

  // Trips list
  tripsList: { marginTop: 8, gap: 8 },
  tripItem: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  tripTime: { fontSize: 14, fontWeight: '900', color: DARK_GREEN, minWidth: 48 },
  tripRoute: { fontSize: 12, fontWeight: '700', color: '#111827' },
  tripSeats: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  seatsBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  seatsBadgeOk: { backgroundColor: '#ECFDF5' },
  seatsBadgeFew: { backgroundColor: '#FEF3C7' },
  seatsBadgeText: { fontSize: 9, fontWeight: '800' },
  tripPrice: { fontSize: 14, fontWeight: '900', color: GREEN, marginLeft: 4 },

  // Return promo
  returnPromo: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#BBF7D0',
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  returnPromoIcon: { fontSize: 22 },
  returnPromoTitle: { fontSize: 13, fontWeight: '900', color: '#065F46' },
  returnPromoSub: { fontSize: 10, color: '#059669', marginTop: 2 },
  pointsBadge: {
    backgroundColor: '#059669', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pointsText: { fontSize: 9, fontWeight: '900', color: '#fff' },
});
