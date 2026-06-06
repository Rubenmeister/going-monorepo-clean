/**
 * PrivateRideBookingScreen — Reserva de Viaje Privado
 *
 * Mockup #8. El pasajero reserva el vehículo COMPLETO a su horario.
 *
 * Flujo:
 *   1. Origen → Destino con zona en Quito (5 zonas con surcharge)
 *   2. Fecha (Hoy/Mañana/Otra) + Hora (slots 30 min)
 *   3. Vehículo: SUV, SUV XL, VAN, VAN XL, BUS, BUS XL (con fotos)
 *   4. Categoría: Confort | Premium | Empresa (si user.companyId)
 *   5. Resumen de precio + CTA sticky bottom
 *
 * Theme adaptativo light + dark. Brand navy + yellow accents.
 *
 * REFIT 2026-05-23:
 *   - Theme adaptativo (antes hardcoded BLACK + GOLD)
 *   - Date + Time funcionales (slots + segment, sin extra deps)
 *   - "Cambiar origen" wire al modal city picker (antes botón muerto)
 *   - Empresa solo visible si user.companyId (B2B real)
 *   - Sticky CTA bottom con total
 *
 * TODO declarado:
 *   - BUS XL falta del catalog/vehicles.ts (hoy solo hasta 'bus' 20pax)
 *   - Pricing Privado independiente de ciudad origen (priceBase fijo).
 *     El catalog tiene calcPrice() que sí depende de ciudad — modelo
 *     distinto. Decidir cuál es canónico en task #44 backend rename.
 *   - DateTimePicker nativo para "Otra fecha"
 *   - Selector cantidad pasajeros (útil para matching pero no para pricing
 *     ya que es vehículo completo)
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import {
  QUITO_ZONES, ORIGIN_CITIES,
  type QuitoZone,
  type Category,
} from '../../catalog';
import { useTheme, type ThemeTokens } from '../../theme';

// ── Vehículos privados (con fotos locales — no importables del catalog) ───────
// Catalog tiene types pero no el shape con `photo: require(...)`. Mantenemos
// definición local hasta unificar (TODO: catalog/vehicle-media.ts).
const VEHICLES = [
  {
    id: 'suv', label: 'SUV', capacity: 3,
    desc: '3 pasajeros · Confort',
    priceBase: 30,
    photo: require('../../../assets/1. uv.jpg'),
  },
  {
    id: 'suv_xl', label: 'SUV XL', capacity: 5,
    desc: '5 pasajeros · 3 filas',
    priceBase: 50,
    photo: require('../../../assets/2.suvxl.jpg'),
  },
  {
    id: 'van', label: 'VAN', capacity: 8,
    desc: '8 pasajeros · Grupos',
    priceBase: 64,
    photo: require('../../../assets/3van.jpg'),
  },
  {
    id: 'van_xl', label: 'VAN XL', capacity: 12,
    desc: '12 pasajeros · Corporate',
    priceBase: 96,
    photo: require('../../../assets/4.VAN XL.jpg'),
  },
  {
    id: 'bus', label: 'BUS', capacity: 20,
    desc: '17-20 pasajeros · Turismo',
    priceBase: 140,
    photo: require('../../../assets/5. bus grande y pequeño.png'),
  },
  {
    id: 'bus_xl', label: 'BUS XL', capacity: 40,
    desc: '30-40 pasajeros · Clase',
    priceBase: 245,
    photo: require('../../../assets/6. bus.png'),
  },
] as const;

type VehicleId = typeof VEHICLES[number]['id'];

// ── Time slots cada 30 min 6 AM - 10 PM ──────────────────────────────────────
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
})();

type DateOption = 'today' | 'tomorrow' | 'other';

// ── Params ────────────────────────────────────────────────────────────────────
export type PrivateRideBookingParams = {
  originCity?: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function PrivateRideBookingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: PrivateRideBookingParams }, 'params'>>();
  const { user }   = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  // Si el usuario está vinculado a una empresa, mostrar categoría Empresa
  const hasCompany = !!(user as any)?.companyId;

  // ── State ──────────────────────────────────────────────────
  const [originCity,    setOriginCity]    = useState(route.params?.originCity ?? 'Quito');
  const [destination,   setDestination]   = useState('');
  const [destCoords,    setDestCoords]    = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZone,  setSelectedZone]  = useState<QuitoZone>('quito_norte');
  const [selectedVeh,   setSelectedVeh]   = useState<VehicleId>('suv');
  const [selectedCat,   setSelectedCat]   = useState<Category>('confort');
  const [dateOption,    setDateOption]    = useState<DateOption>('today');
  const [timeSlot,      setTimeSlot]      = useState('08:00');
  const [showZones,     setShowZones]     = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Recibir ubicación del LocationPicker
  useEffect(() => {
    const loc = (route.params as any)?.selectedDestination;
    if (loc) {
      setDestination(loc.address);
      if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        setDestCoords({ lat: loc.latitude, lng: loc.longitude });
      }
    }
  }, [(route.params as any)?.selectedDestination]);

  // Si la categoría Empresa estaba seleccionada y el user ya no tiene
  // companyId (logout/relink), volver a confort.
  useEffect(() => {
    if (selectedCat === 'empresa' && !hasCompany) setSelectedCat('confort');
  }, [hasCompany, selectedCat]);

  // ── Computed ──────────────────────────────────────────────
  const vehicle = VEHICLES.find(v => v.id === selectedVeh)!;
  const zone    = QUITO_ZONES.find(z => z.id === selectedZone)!;

  // Categorías locales con metadata UI
  const CATEGORIES_UI = [
    { id: 'confort' as const, label: 'Confort', desc: 'Equipado y cómodo',           multiplier: 1.0,
      icon: 'shield-checkmark-outline' as const, accent: tokens.brandNavy },
    { id: 'premium' as const, label: 'Premium', desc: 'Gama alta · servicio exclusivo', multiplier: 1.5,
      icon: 'diamond-outline' as const, accent: tokens.premiumBorder },
    { id: 'empresa' as const, label: 'Empresa', desc: 'Descuento corporativo -30%',  multiplier: 0.7,
      icon: 'business-outline' as const, accent: tokens.success },
  ].filter(c => c.id !== 'empresa' || hasCompany);

  const category    = CATEGORIES_UI.find(c => c.id === selectedCat) ?? CATEGORIES_UI[0];
  const subtotal    = Math.round(vehicle.priceBase * category.multiplier);
  const totalPrice  = subtotal + zone.surcharge;

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
  const handleOpenLocationPicker = useCallback(() => {
    hapticLight();
    (navigation.navigate as any)('LocationPicker', {
      title:        'Destino del viaje',
      mode:         'destination',
      accentColor:  tokens.brandNavy,
      returnScreen: 'PrivateRideBooking',
      paramKey:     'selectedDestination',
    });
  }, [navigation, tokens]);

  /**
   * Mobile #60 gap C — antes navegaba a ConfirmRide con totalPrice
   * calculado client-side (pricing hardcoded). Ahora navega a
   * BookingOptionsScreen para que el backend (/search) devuelva el
   * precio AUTORITATIVO según hora pico, surge, corredor, segment.
   *
   * El user ve las opciones reales del backend y escoge — si el
   * scheduledDateTime cae en una ventana con scheduled trips disponibles,
   * el cascade del backend muestra también esos cupos como sugerencia.
   *
   * Requisitos: destCoords (lat/lng del destination LocationPicker) y
   * pickup coords. Pickup hoy lo derivamos del centro de la zone
   * seleccionada (mapeo Quito → coords del distrito). Cuando todo el
   * tráfico pase por HomeScreen wizard, esta pantalla se puede borrar.
   */
  const handleReserve = useCallback(() => {
    if (!destination || !destCoords) {
      hapticMedium();
      Alert.alert(
        'Destino requerido',
        'Selecciona el destino en el mapa antes de continuar.',
      );
      return;
    }
    hapticMedium();

    // Pickup coords: centro de la zone elegida — placeholder hasta que el
    // wizard de HomeScreen reemplace este flujo.
    const ZONE_CENTERS: Record<string, { lat: number; lng: number }> = {
      quito_norte:    { lat: -0.1380, lng: -78.4880 },
      quito_centro:   { lat: -0.2299, lng: -78.5249 },
      quito_sur:      { lat: -0.2820, lng: -78.5450 },
      quito_valles:   { lat: -0.2050, lng: -78.4000 },
      cumbaya:        { lat: -0.2050, lng: -78.4283 },
      aeropuerto:     { lat: -0.1413, lng: -78.4881 },
    };
    const pickupCoords = ZONE_CENTERS[selectedZone] ?? ZONE_CENTERS.quito_centro;

    // Scheduled date construction — combinamos dateOption + timeSlot
    let scheduledDateTime: string | undefined;
    let temporalPreference: 'immediate' | 'scheduled' = 'immediate';
    if (dateOption !== 'today' || timeSlot !== '08:00') {
      // Para reservas no inmediatas (mañana o tarde del día)
      const d = new Date();
      if (dateOption === 'tomorrow') d.setDate(d.getDate() + 1);
      const [h, m] = timeSlot.split(':').map(Number);
      d.setHours(h, m, 0, 0);
      // Solo enviamos scheduled si la hora es futura > 30min
      if (d.getTime() - Date.now() > 30 * 60_000) {
        scheduledDateTime = d.toISOString();
        temporalPreference = 'scheduled';
      }
    }

    navigation.navigate('BookingOptions', {
      pickup: {
        latitude:  pickupCoords.lat,
        longitude: pickupCoords.lng,
        address:   originCity,
      },
      destination: {
        latitude:  destCoords.lat,
        longitude: destCoords.lng,
        address:   destination,
      },
      temporalPreference,
      scheduledDateTime,
      vehicleType: vehicle.id as any, // 'suv' | 'suv_xl' | 'van' | etc
    });
  }, [destination, destCoords, originCity, vehicle, selectedZone, timeSlot, dateOption, navigation]);

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ══ HEADER navy + EXCLUSIVE badge dorado ══════════════ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={tokens.textOnNavy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Viaje Privado</Text>
            <Text style={styles.headerSub}>Vehículo exclusivo · Tu horario</Text>
          </View>
          <View style={styles.exclusiveBadge}>
            <Ionicons name="lock-closed" size={10} color={tokens.textOnYellow} />
            <Text style={styles.exclusiveText}>EXCLUSIVO</Text>
          </View>
        </View>

        {/* Ruta */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: tokens.brandYellow }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLbl}>ORIGEN</Text>
              <Text style={styles.routeVal}>{originCity}</Text>
            </View>
            <TouchableOpacity onPress={() => { hapticLight(); setShowCityPicker(true); }}>
              <Text style={styles.routeChange}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotDest]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLbl}>DESTINO · {zone.label}</Text>
              <Text style={[styles.routeVal, !destination && styles.routeValEmpty]}>
                {destination || '¿A dónde vas?'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <TouchableOpacity onPress={handleOpenLocationPicker}>
                <Text style={styles.routeChange}>Buscar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { hapticLight(); setShowZones(p => !p); }}>
                <Text style={[styles.routeChange, styles.routeChangeSmall]}>
                  Zona {zone.surcharge > 0 ? `+$${zone.surcharge}` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Zone selector */}
        {showZones && (
          <View style={styles.zonePicker}>
            {QUITO_ZONES.map(z => (
              <TouchableOpacity
                key={z.id}
                style={[styles.zoneOpt, selectedZone === z.id && styles.zoneOptActive]}
                onPress={() => { setSelectedZone(z.id); setShowZones(false); hapticLight(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, selectedZone === z.id && styles.zoneNameActive]}>
                    {z.label}
                  </Text>
                  <Text style={[styles.zoneExamples, selectedZone === z.id && styles.zoneExamplesActive]} numberOfLines={1}>
                    {z.examples}
                  </Text>
                </View>
                <Text style={[styles.zoneSurchargeTxt, selectedZone === z.id && styles.zoneSurchargeActive]}>
                  {z.surcharge === 0 ? 'Base' : `+$${z.surcharge}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Fecha + Hora ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Fecha de salida</Text>
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
                      'El selector de fecha personalizada se integrará en la próxima versión.',
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

        <View style={styles.section}>
          <Text style={styles.secTitle}>Hora de salida</Text>
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

        {/* ── Selector de vehículo ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Elige tu vehículo</Text>
          {VEHICLES.map(v => {
            const active = selectedVeh === v.id;
            const price  = Math.round(v.priceBase * category.multiplier) + zone.surcharge;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                onPress={() => { setSelectedVeh(v.id); hapticLight(); }}
                activeOpacity={0.85}
              >
                {active && (
                  <View style={styles.vehicleCheck}>
                    <Ionicons name="checkmark" size={12} color={tokens.textOnYellow} />
                  </View>
                )}
                <Image source={v.photo} style={styles.vehicleThumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <View style={styles.vehicleTopRow}>
                    <Text style={[styles.vehicleName, active && styles.vehicleNameActive]}>
                      {v.label}
                    </Text>
                    <View style={styles.capacityBadge}>
                      <Ionicons name="people-outline" size={10} color={tokens.textTertiary} />
                      <Text style={styles.capacityText}>{v.capacity} pax</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleDesc}>{v.desc}</Text>
                </View>
                <View style={styles.vehiclePrice}>
                  <Text style={[styles.vehiclePriceVal, active && styles.vehiclePriceValActive]}>
                    ${price}
                  </Text>
                  <Text style={styles.vehiclePriceLbl}>total</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Categoría ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Categoría</Text>
          <View style={styles.catRow}>
            {CATEGORIES_UI.map(cat => {
              const active = selectedCat === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    active && { borderColor: cat.accent, borderWidth: 2, backgroundColor: `${cat.accent}0F` },
                  ]}
                  onPress={() => { setSelectedCat(cat.id); hapticLight(); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={cat.icon} size={20} color={active ? cat.accent : tokens.textTertiary} />
                  <Text style={[styles.catLabel, active && { color: cat.accent }]}>{cat.label}</Text>
                  <Text style={styles.catDesc}>
                    {cat.multiplier > 1 ? `+${Math.round((cat.multiplier - 1) * 100)}%`
                      : cat.multiplier < 1 ? `-${Math.round((1 - cat.multiplier) * 100)}%`
                      : 'Base'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!hasCompany && (
            <Text style={styles.catNote}>
              ¿Tu empresa tiene cuenta corporativa? Vincúlala en Perfil → Empresa para acceder a precios B2B.
            </Text>
          )}
        </View>

        {/* ── Resumen de precio ─────────────────────────────── */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLbl}>{vehicle.label} · {vehicle.capacity} pax (base)</Text>
              <Text style={styles.priceVal}>${vehicle.priceBase}</Text>
            </View>
            {category.multiplier !== 1 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLbl}>Categoría {category.label}</Text>
                <Text style={[
                  styles.priceVal,
                  { color: category.multiplier > 1 ? tokens.error : tokens.success },
                ]}>
                  {category.multiplier > 1 ? '+' : ''}{Math.round((vehicle.priceBase * category.multiplier) - vehicle.priceBase)}
                </Text>
              </View>
            )}
            {zone.surcharge > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLbl}>Recargo {zone.label}</Text>
                <Text style={styles.priceVal}>+${zone.surcharge}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLbl}>Servicio Going App</Text>
              <Text style={[styles.priceVal, { color: tokens.success }]}>incluido</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotalRow]}>
              <Text style={styles.priceTotalLbl}>Total vehículo completo</Text>
              <Text style={styles.priceTotalVal}>${totalPrice}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── CTA sticky bottom ────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <View style={styles.ctaTotal}>
          <Text style={styles.ctaTotalLabel}>Total exclusivo</Text>
          <Text style={styles.ctaTotalValue}>${totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, !destination && styles.ctaBtnDisabled]}
          onPress={handleReserve}
          disabled={!destination}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Reservar {vehicle.label}</Text>
          <Ionicons name="arrow-forward" size={18} color={tokens.textOnYellow} />
        </TouchableOpacity>
      </View>

      {/* ── Modal city picker ────────────────────────────────── */}
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
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20, fontWeight: '900', color: t.textOnNavy,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontSize: 11, color: 'rgba(255,255,255,0.65)',
      marginTop: 2, fontWeight: '600',
    },
    exclusiveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: t.brandYellow, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    exclusiveText: {
      fontSize: 9, fontWeight: '900',
      color: t.textOnYellow, letterSpacing: 0.5,
    },

    // Route card
    routeCard: {
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderRadius: 16, paddingHorizontal: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    routeRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingVertical: 11,
    },
    dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    dotDest: {
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
    },
    routeLbl: {
      fontSize: 9, color: 'rgba(255,255,255,0.55)',
      fontWeight: '700', letterSpacing: 0.5,
    },
    routeVal: {
      fontSize: 14, fontWeight: '800',
      color: t.textOnNavy, marginTop: 1,
    },
    routeValEmpty: { color: 'rgba(255,255,255,0.4)' },
    routeChange: {
      fontSize: 11, fontWeight: '800',
      color: t.brandYellow,
    },
    routeChangeSmall: { fontSize: 10, opacity: 0.75 },
    routeDivider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
      marginLeft: 22,
    },

    // Zone picker
    zonePicker: {
      backgroundColor: t.bgLayer,
      borderRadius: 14, marginTop: 10, overflow: 'hidden',
    },
    zoneOpt: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    zoneOptActive: { backgroundColor: t.brandNavy },
    zoneName: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    zoneNameActive: { color: t.textOnNavy },
    zoneExamples: { fontSize: 10, color: t.textTertiary, marginTop: 2 },
    zoneExamplesActive: { color: 'rgba(255,255,255,0.7)' },
    zoneSurchargeTxt: { fontSize: 12, fontWeight: '800', color: t.brandNavy },
    zoneSurchargeActive: { color: t.brandYellow },

    // Content
    scroll: { flex: 1 },
    section: { paddingHorizontal: 16, paddingTop: 18 },
    secTitle: {
      fontSize: 11, fontWeight: '800', color: t.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    },

    // Date
    dateRow: { flexDirection: 'row', gap: 8 },
    dateBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      alignItems: 'center',
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
      marginTop: 8, textAlign: 'center', textTransform: 'capitalize',
    },

    // Time slots
    timeSlotsRow: { gap: 8, paddingRight: 10 },
    timeSlot: {
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      minWidth: 64, alignItems: 'center',
    },
    timeSlotActive: { backgroundColor: t.brandNavy, borderColor: t.brandNavy },
    timeSlotText: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    timeSlotTextActive: { color: t.textOnNavy },

    // Vehicle cards
    vehicleCard: {
      backgroundColor: t.bgLayer, borderRadius: 16,
      padding: 14, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 2, borderColor: t.border,
      position: 'relative', overflow: 'hidden',
    },
    vehicleCardActive: {
      borderColor: t.brandYellow,
      backgroundColor: `${t.brandYellow}0C`,
    },
    vehicleCheck: {
      position: 'absolute', top: 10, right: 10,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: t.brandYellow,
      alignItems: 'center', justifyContent: 'center',
    },
    vehicleThumb: { width: 80, height: 60, borderRadius: 10 },
    vehicleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    vehicleName: { fontSize: 15, fontWeight: '900', color: t.textPrimary },
    vehicleNameActive: { color: t.brandNavy },
    capacityBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: t.glass, borderRadius: 20,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    capacityText: { fontSize: 10, fontWeight: '700', color: t.textTertiary },
    vehicleDesc: { fontSize: 11, color: t.textTertiary },
    vehiclePrice: { alignItems: 'flex-end' },
    vehiclePriceVal: { fontSize: 18, fontWeight: '900', color: t.textPrimary },
    vehiclePriceValActive: { color: t.brandNavy },
    vehiclePriceLbl: { fontSize: 9, color: t.textTertiary, fontWeight: '600' },

    // Categories
    catRow: { flexDirection: 'row', gap: 10 },
    catCard: {
      flex: 1, backgroundColor: t.bgLayer, borderRadius: 14, padding: 12,
      alignItems: 'center', gap: 4,
      borderWidth: 2, borderColor: t.border,
    },
    catLabel: { fontSize: 12, fontWeight: '900', color: t.textPrimary },
    catDesc: { fontSize: 10, fontWeight: '700', color: t.textTertiary },
    catNote: {
      fontSize: 11, color: t.textTertiary, fontStyle: 'italic',
      marginTop: 10, lineHeight: 16,
    },

    // Price summary
    priceSummary: {
      backgroundColor: t.bgLayer, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: t.border,
    },
    priceRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginBottom: 8, alignItems: 'center',
    },
    priceLbl: { fontSize: 12, color: t.textSecondary },
    priceVal: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    priceTotalRow: {
      paddingTop: 12, marginTop: 4,
      borderTopWidth: 1, borderTopColor: t.border, marginBottom: 0,
    },
    priceTotalLbl: { fontSize: 14, fontWeight: '900', color: t.textPrimary },
    priceTotalVal: { fontSize: 22, fontWeight: '900', color: t.brandNavy, letterSpacing: -0.5 },

    // CTA sticky
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
      paddingHorizontal: 18, paddingVertical: 14,
      borderRadius: 14,
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    ctaBtnDisabled: { opacity: 0.45 },
    ctaBtnText: {
      fontSize: 14, fontWeight: '900',
      color: t.textOnYellow, letterSpacing: 0.3,
    },

    // Modal city picker
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
