/**
 * SharedRideBookingScreen — Reserva de Viaje Compartido
 *
 * Mockup #7. Flujo:
 *   1. Origen (default desde route.params, modificable con city picker)
 *   2. Destino (search via LocationPicker)
 *   3. Zona destino en Quito (5 zonas con surcharge)
 *   4. Fecha (Hoy / Mañana / Otra) + Hora (slot picker 6 AM - 10 PM)
 *   5. Tier: Confort | Premium
 *   6. Cantidad de asientos (1-3)
 *   7. Upsell asiento delantero (+$3) — solo si 1 asiento
 *   8. CTA "Reservar viaje" → ConfirmRide con todo el contexto
 *
 * Theme adaptativo light + dark. Brand navy + yellow accents.
 *
 * REFIT 2026-05-23 (post mockup canónico):
 *   - Eliminado stub "Cambiar origen" → city picker modal real
 *   - Date + Time funcionales (slots + selector, sin extra deps)
 *   - Zone picker ahora se abre via botón "Cambiar zona"
 *   - Selector tier Confort/Premium agregado (brand decision)
 *   - Selector cantidad asientos agregado
 *   - Theme adaptativo (antes hardcoded GREEN palette)
 *
 * TODO declarado:
 *   - availableTrips desde API real (transport-service /trips/available)
 *   - DateTimePicker nativo (cuando agreguemos @react-native-community/datetimepicker)
 *   - Promo regreso (+50 pts) wire a Points/Loyalty service
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, Modal, FlatList,
  Platform, UIManager, LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import {
  GOING_SHARED_ROUTES,
  QUITO_ZONES,
  ORIGIN_CITIES,
  calcSharedSeatPrice,
  loadRecentRoutes,
  saveRecentRoute,
  type QuitoZone,
  type Category,
} from '../../catalog';
import { COVERAGE_CITIES } from '../../catalog/coverage';
import { suggestSharedTripPlan } from '../../catalog/route-suggester';
import { useTheme, type ThemeTokens } from '../../theme';
import type { LocationResult } from '../shared/LocationPickerScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type SharedRideBookingParams = {
  originStop?:      string;
  routeId?:         string;
  preselectedZone?: QuitoZone;
};

type DateOption = 'today' | 'tomorrow' | 'other';

/** Time slots cada 30 min, 06:00-22:00. */
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
})();

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function SharedRideBookingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: SharedRideBookingParams }, 'params'>>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  // ── State ──────────────────────────────────────────────────
  const [originCity,    setOriginCity]    = useState(route.params?.originStop ?? 'Quito');
  const [selectedRoute, setSelectedRoute] = useState(
    route.params?.routeId
      ? GOING_SHARED_ROUTES.find(r => r.id === route.params?.routeId)
      : GOING_SHARED_ROUTES.find(r => r.stopPrices[route.params?.originStop ?? 'Quito'] !== undefined)
        ?? GOING_SHARED_ROUTES[0]
  );
  const [destination,   setDestination]   = useState(
    selectedRoute?.stops[selectedRoute.stops.length - 1] ?? ''
  );
  const [destCoords,    setDestCoords]    = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZone,  setSelectedZone]  = useState<QuitoZone>(route.params?.preselectedZone ?? 'quito_norte');
  const [dateOption,    setDateOption]    = useState<DateOption>('today');
  const [timeSlot,      setTimeSlot]      = useState('08:00');
  const [tier,          setTier]          = useState<Category>('confort');
  const [seats,         setSeats]         = useState(1);
  const [frontSeat,     setFrontSeat]     = useState(false);
  const [showZonePicker, setShowZonePicker]  = useState(false);
  const [showCityPicker, setShowCityPicker]  = useState(false);
  const [recentDests,    setRecentDests]     = useState<string[]>([]);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    loadRecentRoutes().then(routes => {
      const dests = [...new Set(routes.map(r => r.destination))].slice(0, 3);
      setRecentDests(dests);
    });
  }, []);

  // Recibir ubicación seleccionada del LocationPicker
  useEffect(() => {
    const loc: LocationResult | undefined = (route.params as any)?.selectedDestination;
    if (loc) {
      setDestination(loc.address);
      setDestCoords({ lat: loc.latitude, lng: loc.longitude });
    }
  }, [(route.params as any)?.selectedDestination]);

  // Cuando cambia el origin, re-evaluar selectedRoute
  useEffect(() => {
    const nextRoute = GOING_SHARED_ROUTES.find(r => r.stopPrices[originCity] !== undefined);
    if (nextRoute && nextRoute.id !== selectedRoute?.id) {
      setSelectedRoute(nextRoute);
      setDestination(nextRoute.stops[nextRoute.stops.length - 1]);
    }
  }, [originCity]);

  // Si seats > 1, forzar frontSeat=false (no se vende delantero para múltiples asientos)
  useEffect(() => {
    if (seats > 1 && frontSeat) setFrontSeat(false);
  }, [seats]);

  // ── Computed ──────────────────────────────────────────────
  const basePricePerSeat = calcSharedSeatPrice(originCity, selectedZone, frontSeat, selectedRoute?.id);
  // Multiplicador por tier (Premium 1.5x)
  const tierMultiplier = tier === 'premium' ? 1.5 : 1.0;
  const pricePerSeat   = basePricePerSeat * tierMultiplier;
  const totalPrice     = pricePerSeat * seats;
  const zoneInfo       = QUITO_ZONES.find(z => z.id === selectedZone)!;

  const dateLabel = useMemo(() => {
    if (dateOption === 'today') {
      return new Date().toLocaleDateString('es-EC', {
        weekday: 'long', day: 'numeric', month: 'short',
      });
    }
    if (dateOption === 'tomorrow') {
      const t = new Date(); t.setDate(t.getDate() + 1);
      return t.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'short' });
    }
    return 'Otra fecha';
  }, [dateOption]);

  // ── Handlers ──────────────────────────────────────────────
  const toggleZonePicker = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    hapticLight();
    setShowZonePicker(prev => !prev);
  }, []);

  const handleOpenLocationPicker = useCallback(() => {
    hapticLight();
    (navigation.navigate as any)('LocationPicker', {
      title:        'Destino en Quito',
      mode:         'destination',
      accentColor:  tokens.brandNavy,
      returnScreen: 'SharedRideBooking',
      paramKey:     'selectedDestination',
    });
  }, [navigation, tokens]);

  const handleConfirm = useCallback(async () => {
    if (!destination) {
      Alert.alert('Destino requerido', 'Por favor selecciona un destino antes de continuar.');
      return;
    }

    // Restricción carpool + sugerencia de hub cercano cuando no hay ruta directa.
    // Necesitamos coords del origen para evaluar — mapeamos el originCity string
    // al centroide canónico (COVERAGE_CITIES viene de libs/pricing).
    if (destCoords) {
      const originCentroid = COVERAGE_CITIES.find(
        c => c.id === originCity.toLowerCase() || c.label.toLowerCase() === originCity.toLowerCase(),
      );

      if (originCentroid) {
        const plan = suggestSharedTripPlan(
          originCentroid.lat,
          originCentroid.lng,
          destCoords.lat,
          destCoords.lng,
        );

        if (plan.kind === 'nearest') {
          // Ruta directa no existe pero hay hub cercano al destino. Pregúntale.
          Alert.alert(
            'No hay viaje compartido directo a ese destino',
            `Te podemos llevar hasta ${plan.hubLabel} por $${plan.price.toFixed(2)} (servicio Compartido). Desde ${plan.hubLabel} son ~${plan.estimatedLastLegMinutes} min en transporte local hasta tu destino (${plan.lastLegKm} km).\n\n¿Querés tomar la opción a ${plan.hubLabel}, o cambiar a viaje Privado puerta a puerta?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cambiar a Privado',
                onPress: () => (navigation.navigate as any)('PrivateRideBooking', {
                  originCity,
                  presetDestination: destination,
                  presetDestCoords: destCoords,
                }),
              },
              {
                text: `Sí, llevame hasta ${plan.hubLabel}`,
                onPress: () => {
                  // Continuamos el flujo pero el destino ahora es el hub.
                  (navigation.navigate as any)('ConfirmRide', {
                    type:          'compartido',
                    origin:        originCity,
                    destination:   plan.hubLabel,
                    destCoords:    { lat: originCentroid.lat, lng: originCentroid.lng }, // placeholder, ConfirmRide pide coords
                    departureTime: timeSlot,
                    date:          dateOption,
                    vehicle:       'SUV',
                    tier,
                    seats,
                    pricePerSeat:  plan.price,
                    totalPrice:    plan.price * seats,
                    frontSeat,
                    zone:          selectedZone,
                    /** Nota para mostrar al usuario en ConfirmRide. */
                    note: `Te llevamos a ${plan.hubLabel}. Desde ahí ~${plan.estimatedLastLegMinutes} min en transporte local hasta ${destination} (${plan.lastLegKm} km).`,
                  });
                },
              },
            ],
          );
          return;
        }

        if (plan.kind === 'out_of_coverage' || plan.kind === 'no_shared_from_origin') {
          Alert.alert(
            'Destino fuera de cobertura compartida',
            `${plan.reason}\n\n¿Cambiamos a viaje Privado puerta a puerta?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cambiar a Privado',
                onPress: () => (navigation.navigate as any)('PrivateRideBooking', {
                  originCity,
                  presetDestination: destination,
                  presetDestCoords: destCoords,
                }),
              },
            ],
          );
          return;
        }
        // plan.kind === 'direct' — flujo normal continúa abajo.
      }
    }
    hapticMedium();

    // Persist recent route para que aparezca en home
    await saveRecentRoute({
      origin:      originCity,
      destination,
      originCity:  'quito',  // TODO: mapear originStop string → CityId si lo necesitamos
      vehicleType: 'suv',
      tripMode:    'compartido',
      price:       totalPrice,
    }).catch(() => {});

    (navigation.navigate as any)('ConfirmRide', {
      type:          'compartido',
      origin:        originCity,
      destination,
      destCoords:    destCoords ?? undefined,
      departureTime: timeSlot,
      date:          dateOption,
      vehicle:       'SUV',
      tier,
      seats,
      pricePerSeat,
      totalPrice,
      frontSeat,
      zone:          selectedZone,
    });
  }, [destination, originCity, destCoords, timeSlot, dateOption, tier, seats, pricePerSeat, totalPrice, frontSeat, selectedZone, navigation]);

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ══ HEADER navy brand ═══════════════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={tokens.textOnNavy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Viaje Compartido</Text>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>★ POPULAR</Text>
          </View>
        </View>

        {/* Route card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: tokens.brandNavy }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>ORIGEN</Text>
              <Text style={styles.routeValue}>{originCity}</Text>
            </View>
            <TouchableOpacity onPress={() => { hapticLight(); setShowCityPicker(true); }}>
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
                placeholderTextColor={tokens.textTertiary}
                value={destination}
                onChangeText={setDestination}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity onPress={handleOpenLocationPicker}>
              <Text style={styles.routeChange}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Destinos frecuentes ───────────────────────────── */}
        {recentDests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis destinos frecuentes</Text>
            <View style={styles.chipsRow}>
              {recentDests.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => { setDestination(d); hapticLight(); }}
                >
                  <Ionicons name="time-outline" size={13} color={tokens.brandNavy} />
                  <Text style={styles.chipText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Zona destino ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona destino</Text>
          <TouchableOpacity
            style={styles.zoneSummary}
            onPress={toggleZonePicker}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneSummaryName}>{zoneInfo.label}</Text>
              <Text style={styles.zoneSummaryExamples} numberOfLines={1}>
                {zoneInfo.examples}
              </Text>
            </View>
            <View style={styles.zoneSurcharge}>
              <Text style={styles.zoneSurchargeText}>
                {zoneInfo.surcharge === 0 ? 'Base' : `+$${zoneInfo.surcharge}`}
              </Text>
            </View>
            <Ionicons
              name={showZonePicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={tokens.textTertiary}
            />
          </TouchableOpacity>
          {showZonePicker && (
            <View style={styles.zonePicker}>
              {QUITO_ZONES.map(z => (
                <TouchableOpacity
                  key={z.id}
                  style={[styles.zoneOption, selectedZone === z.id && styles.zoneOptionActive]}
                  onPress={() => { setSelectedZone(z.id); setShowZonePicker(false); hapticLight(); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zoneOptName, selectedZone === z.id && styles.zoneOptNameActive]}>
                      {z.label}
                    </Text>
                    <Text style={[styles.zoneOptExamples, selectedZone === z.id && styles.zoneOptExamplesActive]} numberOfLines={1}>
                      {z.examples}
                    </Text>
                  </View>
                  <Text style={[styles.zoneOptSurcharge, selectedZone === z.id && styles.zoneOptSurchargeActive]}>
                    {z.surcharge === 0 ? 'Base' : `+$${z.surcharge}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Fecha ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha de salida</Text>
          <View style={styles.dateRow}>
            {(['today', 'tomorrow', 'other'] as DateOption[]).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.dateBtn, dateOption === opt && styles.dateBtnActive]}
                onPress={() => {
                  hapticLight();
                  if (opt === 'other') {
                    Alert.alert(
                      'Otra fecha',
                      'El selector de fecha personalizada se integrará en la próxima versión. Por ahora puedes elegir Hoy o Mañana.',
                    );
                    return;
                  }
                  setDateOption(opt);
                }}
              >
                <Text style={[styles.dateBtnText, dateOption === opt && styles.dateBtnTextActive]}>
                  {opt === 'today' ? 'Hoy' : opt === 'tomorrow' ? 'Mañana' : 'Otra'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.dateCaption}>{dateLabel}</Text>
        </View>

        {/* ── Hora ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hora de salida</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotsRow}
          >
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeSlot, timeSlot === t && styles.timeSlotActive]}
                onPress={() => { setTimeSlot(t); hapticLight(); }}
              >
                <Text style={[styles.timeSlotText, timeSlot === t && styles.timeSlotTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Tier Confort / Premium ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoría</Text>
          <View style={styles.tierRow}>
            <TouchableOpacity
              style={[styles.tierBtn, tier === 'confort' && styles.tierBtnActive]}
              onPress={() => { setTier('confort'); hapticLight(); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.tierName, tier === 'confort' && styles.tierNameActive]}>
                Confort
              </Text>
              <Text style={[styles.tierDesc, tier === 'confort' && styles.tierDescActive]}>
                SUV estándar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tierBtn, styles.tierBtnPremium, tier === 'premium' && styles.tierBtnPremiumActive]}
              onPress={() => { setTier('premium'); hapticLight(); }}
              activeOpacity={0.85}
            >
              <View style={styles.tierLabelRow}>
                <Ionicons name="diamond" size={11} color={tokens.premiumBorder} />
                <Text style={[styles.tierName, styles.tierNamePremium, tier === 'premium' && styles.tierNameActive]}>
                  Premium
                </Text>
              </View>
              <Text style={[styles.tierDesc, tier === 'premium' && styles.tierDescActive]}>
                SUV gama alta · 1.5x
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cantidad de asientos ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cantidad de asientos</Text>
          <View style={styles.seatsRow}>
            <TouchableOpacity
              style={[styles.seatsBtn, seats <= 1 && styles.seatsBtnDisabled]}
              onPress={() => { if (seats > 1) { setSeats(s => s - 1); hapticLight(); } }}
              disabled={seats <= 1}
            >
              <Ionicons name="remove" size={20} color={seats <= 1 ? tokens.textTertiary : tokens.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.seatsCount}>{seats}</Text>
            <TouchableOpacity
              style={[styles.seatsBtn, seats >= 3 && styles.seatsBtnDisabled]}
              onPress={() => { if (seats < 3) { setSeats(s => s + 1); hapticLight(); } }}
              disabled={seats >= 3}
            >
              <Ionicons name="add" size={20} color={seats >= 3 ? tokens.textTertiary : tokens.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.seatsCaption}>
              {seats === 1 ? 'pasajero' : 'pasajeros'} en SUV (máx 3)
            </Text>
          </View>
        </View>

        {/* ── Upsell asiento delantero (solo si 1 asiento) ──── */}
        {seats === 1 && (
          <TouchableOpacity
            style={[styles.upsell, frontSeat && styles.upsellActive]}
            onPress={() => { setFrontSeat(p => !p); hapticLight(); }}
            activeOpacity={0.85}
          >
            <View style={[styles.upsellIcon, frontSeat && styles.upsellIconActive]}>
              <Ionicons
                name={frontSeat ? 'checkmark' : 'star-outline'}
                size={20}
                color={frontSeat ? tokens.textOnYellow : tokens.brandYellowDark}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upsellTitle}>Asiento delantero</Text>
              <Text style={styles.upsellSub}>Mayor espacio · mejor vista del paisaje</Text>
            </View>
            <Text style={styles.upsellPrice}>+$3</Text>
          </TouchableOpacity>
        )}

        {/* ── Resumen de precio ─────────────────────────────── */}
        <View style={styles.priceSummary}>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>Precio por asiento</Text>
            <Text style={styles.priceLineValue}>${pricePerSeat.toFixed(2)}</Text>
          </View>
          {seats > 1 && (
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>× {seats} asientos</Text>
              <Text style={styles.priceLineValue}>${(pricePerSeat * seats).toFixed(2)}</Text>
            </View>
          )}
          {tier === 'premium' && (
            <Text style={styles.priceNote}>Incluye recargo Premium (1.5x)</Text>
          )}
          {zoneInfo.surcharge > 0 && (
            <Text style={styles.priceNote}>Incluye recargo de zona +${zoneInfo.surcharge}</Text>
          )}
          {frontSeat && (
            <Text style={styles.priceNote}>Incluye asiento delantero +$3</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── CTA principal (sticky bottom) ───────────────────── */}
      <View style={styles.ctaBar}>
        <View style={styles.ctaTotal}>
          <Text style={styles.ctaTotalLabel}>Total a pagar</Text>
          <Text style={styles.ctaTotalValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, !destination && styles.ctaBtnDisabled]}
          onPress={handleConfirm}
          disabled={!destination}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Reservar</Text>
          <Ionicons name="arrow-forward" size={18} color={tokens.textOnYellow} />
        </TouchableOpacity>
      </View>

      {/* ── Modal city picker ───────────────────────────────── */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar ciudad de origen</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <Ionicons name="close" size={26} color={tokens.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ORIGIN_CITIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityOption}
                onPress={() => {
                  setOriginCity(item.label);
                  setShowCityPicker(false);
                  hapticLight();
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cityOptionLabel}>{item.label}</Text>
                  <Text style={styles.cityOptionProvince}>{item.province}</Text>
                </View>
                {originCity === item.label && (
                  <Ionicons name="checkmark-circle" size={22} color={tokens.brandNavy} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.cityDivider} />}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── HEADER navy ────────────────────────────────────────
    header: {
      backgroundColor: t.brandNavy,
      paddingTop: 52,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    headerTop: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, marginBottom: 18,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20, fontWeight: '900',
      color: t.textOnNavy, flex: 1,
      letterSpacing: -0.3,
    },
    popularBadge: {
      backgroundColor: t.brandYellow,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    },
    popularText: {
      fontSize: 10, fontWeight: '900',
      color: t.textOnYellow, letterSpacing: 0.5,
    },

    // Route card
    routeCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 16,
      paddingHorizontal: 14,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    routeRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingVertical: 12,
    },
    dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    dotDest: {
      backgroundColor: 'transparent',
      borderWidth: 2, borderColor: t.textTertiary,
    },
    routeLabel: {
      fontSize: 9, color: t.textTertiary,
      fontWeight: '700', letterSpacing: 0.5,
    },
    routeValue: { fontSize: 14, fontWeight: '800', color: t.textPrimary, marginTop: 1 },
    routeChange: { fontSize: 11, fontWeight: '800', color: t.brandNavy },
    routeDivider: { height: 1, backgroundColor: t.border, marginLeft: 22 },
    destInput: {
      fontSize: 14, fontWeight: '700',
      color: t.textPrimary,
      padding: 0, marginTop: 1,
      minWidth: 150,
    },

    // ── Content scroll ─────────────────────────────────────
    scroll: { flex: 1 },
    section: { paddingHorizontal: 20, paddingTop: 18 },
    sectionTitle: {
      fontSize: 11, fontWeight: '800', color: t.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    },

    // Chips destinos frecuentes
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: t.glass, borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    },
    chipText: {
      fontSize: 12, fontWeight: '700',
      color: t.brandNavy,
    },

    // Zone summary + picker
    zoneSummary: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.bgLayer,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    },
    zoneSummaryName: { fontSize: 14, fontWeight: '800', color: t.textPrimary },
    zoneSummaryExamples: {
      fontSize: 11, color: t.textTertiary, marginTop: 2,
    },
    zoneSurcharge: {
      backgroundColor: t.glass,
      borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    },
    zoneSurchargeText: { fontSize: 11, fontWeight: '800', color: t.brandNavy },

    zonePicker: {
      backgroundColor: t.bgLayer,
      borderRadius: 14, marginTop: 8,
      borderWidth: 1, borderColor: t.glassBorder,
      overflow: 'hidden',
    },
    zoneOption: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    zoneOptionActive: { backgroundColor: t.brandNavy },
    zoneOptName: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    zoneOptNameActive: { color: t.textOnNavy },
    zoneOptExamples: { fontSize: 10, color: t.textTertiary, marginTop: 2 },
    zoneOptExamplesActive: { color: 'rgba(255,255,255,0.7)' },
    zoneOptSurcharge: { fontSize: 12, fontWeight: '800', color: t.brandNavy },
    zoneOptSurchargeActive: { color: t.brandYellow },

    // Date row
    dateRow: { flexDirection: 'row', gap: 8 },
    dateBtn: {
      flex: 1, paddingVertical: 12,
      borderRadius: 12, alignItems: 'center',
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    dateBtnActive: {
      backgroundColor: t.brandNavy,
      borderColor: t.brandNavy,
    },
    dateBtnText: { fontSize: 13, fontWeight: '700', color: t.textPrimary },
    dateBtnTextActive: { color: t.textOnNavy },
    dateCaption: {
      fontSize: 12, color: t.textTertiary,
      marginTop: 8, textAlign: 'center',
      textTransform: 'capitalize',
    },

    // Time slots
    timeSlotsRow: { gap: 8, paddingRight: 10 },
    timeSlot: {
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      minWidth: 64, alignItems: 'center',
    },
    timeSlotActive: {
      backgroundColor: t.brandNavy,
      borderColor: t.brandNavy,
    },
    timeSlotText: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    timeSlotTextActive: { color: t.textOnNavy },

    // Tier
    tierRow: { flexDirection: 'row', gap: 10 },
    tierBtn: {
      flex: 1,
      backgroundColor: t.bgLayer,
      borderWidth: 1.5, borderColor: t.confortBorder,
      borderRadius: 14, padding: 14,
    },
    tierBtnActive: {
      borderColor: t.brandNavy,
      borderWidth: 2,
      backgroundColor: `${t.brandNavy}08`,
    },
    tierBtnPremium: {
      borderColor: t.premiumBorder,
      backgroundColor: t.premiumBg,
    },
    tierBtnPremiumActive: {
      borderWidth: 2,
      borderColor: t.premiumBorder,
    },
    tierLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tierName: { fontSize: 14, fontWeight: '800', color: t.textPrimary },
    tierNamePremium: { color: t.premiumText },
    tierNameActive: { color: t.textPrimary },
    tierDesc: { fontSize: 11, color: t.textTertiary, marginTop: 4 },
    tierDescActive: { color: t.textSecondary },

    // Seats
    seatsRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    seatsBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    seatsBtnDisabled: { opacity: 0.4 },
    seatsCount: {
      fontSize: 18, fontWeight: '900',
      color: t.textPrimary, minWidth: 30, textAlign: 'center',
    },
    seatsCaption: {
      flex: 1, fontSize: 12, color: t.textTertiary, marginLeft: 4,
    },

    // Upsell
    upsell: {
      marginHorizontal: 20, marginTop: 18,
      backgroundColor: t.bgLayer,
      borderRadius: 14, borderWidth: 1, borderColor: t.glassBorder,
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    },
    upsellActive: {
      borderColor: t.brandYellow,
      backgroundColor: `${t.brandYellow}10`,
    },
    upsellIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: `${t.brandYellow}20`,
      alignItems: 'center', justifyContent: 'center',
    },
    upsellIconActive: { backgroundColor: t.brandYellow },
    upsellTitle: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    upsellSub: { fontSize: 11, color: t.textTertiary, marginTop: 2 },
    upsellPrice: { fontSize: 15, fontWeight: '900', color: t.brandYellowDark },

    // Price summary
    priceSummary: {
      marginHorizontal: 20, marginTop: 24,
      padding: 14,
      backgroundColor: t.glass,
      borderRadius: 12,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    priceLine: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 4,
    },
    priceLineLabel: { fontSize: 13, color: t.textSecondary },
    priceLineValue: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    priceNote: {
      fontSize: 11, color: t.textTertiary,
      marginTop: 4, fontStyle: 'italic',
    },

    // CTA bar sticky
    ctaBar: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
      backgroundColor: t.bg,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    ctaTotal: { flex: 1 },
    ctaTotalLabel: {
      fontSize: 10, fontWeight: '700', color: t.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    ctaTotalValue: {
      fontSize: 22, fontWeight: '900',
      color: t.textPrimary, marginTop: 2, letterSpacing: -0.5,
    },
    ctaBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.brandYellow,
      paddingHorizontal: 22, paddingVertical: 14,
      borderRadius: 14,
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    ctaBtnDisabled: { opacity: 0.45 },
    ctaBtnText: {
      fontSize: 15, fontWeight: '900',
      color: t.textOnYellow, letterSpacing: 0.3,
    },

    // ── Modal city picker ─────────────────────────────────
    modalContainer: { flex: 1, backgroundColor: t.bg },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '900', color: t.textPrimary },
    cityOption: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
    },
    cityOptionLabel: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    cityOptionProvince: { fontSize: 11, color: t.textTertiary, marginTop: 2 },
    cityDivider: { height: 1, backgroundColor: t.border, marginLeft: 20 },
  });
}
