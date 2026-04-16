/**
 * PrivateRideBookingScreen — Reserva de Viaje Privado
 *
 * El pasajero reserva el vehículo completo a su horario.
 * Flujo:
 *  1. Origen → Destino con zona de Quito
 *  2. Fecha y hora (horario del pasajero)
 *  3. Selector de vehículo con foto (SUV · SUV XL · VAN · VAN XL · BUS · BUS XL)
 *  4. Categoría (Confort / Premium +50% / Empresa -30%)
 *  5. Precio total del vehículo
 *  → Confirmar reserva
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import { QUITO_ZONES, type QuitoZone } from '../home/HomeScreen';

// ── Colores — Privado usa paleta NEGRO + DORADO ───────────────────────────────
const NAVY   = '#0033A0';    // acento secundario (categorías)
const BLACK  = '#111827';    // negro principal
const GOLD   = '#FFCD00';    // dorado Going
const GOLD_DARK = '#D97706'; // dorado oscuro para textos
const RED    = '#C0101A';
const GREEN  = '#059669';

// ── Vehículos disponibles en viaje privado ────────────────────────────────────
const VEHICLES = [
  {
    id: 'suv', label: 'SUV', capacity: 3,
    desc: '3 pasajeros · Confort premium',
    priceBase: 30,
    photo: require('../../../assets/1. uv.jpg'),
  },
  {
    id: 'suv_xl', label: 'SUV XL', capacity: 5,
    desc: '5 pasajeros · 3 filas · Equipaje extra',
    priceBase: 50,
    photo: require('../../../assets/2.suvxl.jpg'),
  },
  {
    id: 'van', label: 'VAN', capacity: 8,
    desc: '8 pasajeros · Ideal para grupos',
    priceBase: 64,
    photo: require('../../../assets/3van.jpg'),
  },
  {
    id: 'van_xl', label: 'VAN XL', capacity: 12,
    desc: '12 pasajeros · Viaje corporativo',
    priceBase: 96,
    photo: require('../../../assets/4.VAN XL.jpg'),
  },
  {
    id: 'bus', label: 'BUS', capacity: 20,
    desc: '17-20 pasajeros · Turismo selectivo',
    priceBase: 140,
    photo: require('../../../assets/5. bus grande y pequeño.png'),
  },
  {
    id: 'bus_xl', label: 'BUS XL', capacity: 40,
    desc: '30-40 pasajeros · Viajes de clase',
    priceBase: 245,
    photo: require('../../../assets/6. bus.png'),
  },
] as const;

type VehicleId = typeof VEHICLES[number]['id'];

// ── Categorías ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'confort',  label: 'Confort',  desc: 'Equipado y cómodo',         multiplier: 1.0,  color: NAVY,  icon: 'shield-checkmark-outline' },
  { id: 'premium',  label: 'Premium',  desc: 'Lujo y servicio exclusivo',  multiplier: 1.5,  color: '#7C3AED', icon: 'diamond-outline' },
  { id: 'empresa',  label: 'Empresa',  desc: 'Descuento corporativo',      multiplier: 0.7,  color: GREEN, icon: 'business-outline' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

// ── Params ────────────────────────────────────────────────────────────────────
export type PrivateRideBookingParams = {
  originCity?: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─────────────────────────────────────────────────────────────────────────────

export function PrivateRideBookingScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: PrivateRideBookingParams }, 'params'>>();

  const [originCity,    setOriginCity]    = useState(route.params?.originCity ?? 'Quito');
  const [destination,   setDestination]   = useState('');

  // Recibir ubicación del LocationPicker
  React.useEffect(() => {
    const loc = (route.params as any)?.selectedDestination;
    if (loc) setDestination(loc.address);
  }, [(route.params as any)?.selectedDestination]);
  const [selectedZone,  setSelectedZone]  = useState<QuitoZone>('quito_norte');
  const [selectedVeh,   setSelectedVeh]   = useState<VehicleId>('suv');
  const [selectedCat,   setSelectedCat]   = useState<CategoryId>('confort');
  const [showZones,     setShowZones]     = useState(false);

  const vehicle    = VEHICLES.find(v => v.id === selectedVeh)!;
  const category   = CATEGORIES.find(c => c.id === selectedCat)!;
  const zone       = QUITO_ZONES.find(z => z.id === selectedZone)!;
  const totalPrice = Math.round(vehicle.priceBase * category.multiplier) + zone.surcharge;

  const handleReserve = () => {
    hapticMedium();
    if (!destination) {
      Alert.alert('Destino requerido', 'Ingresa el destino antes de continuar.');
      return;
    }
    navigation.navigate('ConfirmRide', {
      type:        'privado',
      origin:      originCity,
      destination,
      vehicle:     vehicle.label,
      vehicleId:   vehicle.id,
      capacity:    vehicle.capacity,
      category:    category.label,
      zone:        selectedZone,
      totalPrice,
    });
  };

  return (
    <View style={styles.container}>

      {/* ── HEADER navy premium ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Viaje Privado</Text>
            <Text style={styles.headerSub}>Vehículo exclusivo · Tu horario</Text>
          </View>
          <View style={styles.exclusiveBadge}>
            <Ionicons name="lock-closed" size={10} color={NAVY} />
            <Text style={styles.exclusiveText}>EXCLUSIVO</Text>
          </View>
        </View>

        {/* Ruta */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: YELLOW }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLbl}>ORIGEN</Text>
              <Text style={styles.routeVal}>{originCity}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.routeChange}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLbl}>DESTINO · {zone.label}</Text>
              <Text style={[styles.routeVal, !destination && { color: 'rgba(255,255,255,0.4)' }]}>
                {destination || '¿A dónde vas?'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <TouchableOpacity onPress={() => {
                navigation.navigate('LocationPicker' as any, {
                  title:        'Destino del viaje',
                  mode:         'destination',
                  accentColor:  BLACK,
                  returnScreen: 'PrivateRideBooking',
                  paramKey:     'selectedDestination',
                });
              }}>
                <Text style={styles.routeChange}>Buscar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowZones(p => !p)}>
                <Text style={[styles.routeChange, { fontSize: 10, opacity: 0.7 }]}>
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
                <Text style={[styles.zoneName, selectedZone === z.id && { color: '#fff' }]}>{z.label}</Text>
                <Text style={[styles.zoneSurcharge, selectedZone === z.id && { color: 'rgba(255,255,255,0.8)' }]}>
                  {z.surcharge === 0 ? 'Precio base' : `+$${z.surcharge}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Fecha y hora ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>FECHA Y HORA DE SALIDA</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn}>
              <Ionicons name="calendar-outline" size={20} color={NAVY} />
              <View>
                <Text style={styles.dateLbl}>FECHA</Text>
                <Text style={styles.dateVal}>Hoy, 15 abr</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn}>
              <Ionicons name="time-outline" size={20} color={NAVY} />
              <View>
                <Text style={styles.dateLbl}>HORA</Text>
                <Text style={styles.dateVal}>08:00 AM</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Selector de vehículo ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>ELIGE TU VEHÍCULO</Text>
          {VEHICLES.map(v => {
            const active  = selectedVeh === v.id;
            const price   = Math.round(v.priceBase * category.multiplier) + zone.surcharge;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                onPress={() => { setSelectedVeh(v.id); hapticLight(); }}
                activeOpacity={0.85}
              >
                {active && (
                  <View style={styles.vehicleCheck}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <Image source={v.photo} style={styles.vehicleThumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <View style={styles.vehicleTopRow}>
                    <Text style={[styles.vehicleName, active && { color: NAVY }]}>{v.label}</Text>
                    <View style={styles.capacityBadge}>
                      <Ionicons name="people-outline" size={10} color="#6B7280" />
                      <Text style={styles.capacityText}>{v.capacity} pax</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleDesc}>{v.desc}</Text>
                </View>
                <View style={styles.vehiclePrice}>
                  <Text style={[styles.vehiclePriceVal, active && { color: NAVY }]}>${price}</Text>
                  <Text style={styles.vehiclePriceLbl}>total</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Categoría ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>CATEGORÍA</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map(cat => {
              const active = selectedCat === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, active && { borderColor: cat.color, backgroundColor: `${cat.color}0A` }]}
                  onPress={() => { setSelectedCat(cat.id); hapticLight(); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={cat.icon as any} size={18} color={active ? cat.color : '#9CA3AF'} />
                  <Text style={[styles.catLabel, active && { color: cat.color }]}>{cat.label}</Text>
                  <Text style={[styles.catDesc, active && { color: cat.color }]}>
                    {cat.multiplier > 1 ? `+${Math.round((cat.multiplier - 1) * 100)}%`
                      : cat.multiplier < 1 ? `-${Math.round((1 - cat.multiplier) * 100)}%`
                      : 'Base'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Resumen de precio ────────────────────────────────────────────── */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLbl}>Vehículo ({vehicle.label} · {vehicle.capacity} pax)</Text>
              <Text style={styles.priceVal}>${vehicle.priceBase}</Text>
            </View>
            {category.multiplier !== 1 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLbl}>Categoría {category.label}</Text>
                <Text style={[styles.priceVal, { color: category.multiplier > 1 ? RED : GREEN }]}>
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
              <Text style={styles.priceLbl}>Servicio Going</Text>
              <Text style={[styles.priceVal, { color: GREEN }]}>incluido</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotalRow]}>
              <Text style={styles.priceTotalLbl}>Total vehículo completo</Text>
              <Text style={styles.priceTotalVal}>${totalPrice}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ── BOTÓN CONFIRMAR ──────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve} activeOpacity={0.85}>
          <View>
            <Text style={styles.reserveBtnText}>Reservar {vehicle.label} exclusivo</Text>
            <Text style={styles.reserveBtnSub}>{originCity} → {destination || 'destino'} · ${totalPrice} total</Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Header negro
  header: {
    backgroundColor: BLACK,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 1 },
  exclusiveBadge: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GOLD, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  exclusiveText: { fontSize: 9, fontWeight: '900', color: BLACK },

  // Route
  routeCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeLbl: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5 },
  routeVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  routeChange: { fontSize: 11, fontWeight: '700', color: GOLD },
  routeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 22 },

  // Zone picker
  zonePicker: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14, marginTop: 10, overflow: 'hidden',
  },
  zoneOpt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  zoneOptActive: { backgroundColor: BLACK },
  zoneName: { fontSize: 13, fontWeight: '700', color: '#374151' },
  zoneSurcharge: { fontSize: 12, fontWeight: '800', color: '#6B7280' },

  // Content
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  secTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  // Fecha
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  dateLbl: { fontSize: 9, color: '#9CA3AF', fontWeight: '700' },
  dateVal: { fontSize: 13, fontWeight: '800', color: '#111827', marginTop: 1 },

  // Vehicle cards
  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    position: 'relative', overflow: 'hidden',
  },
  vehicleCardActive: { borderColor: GOLD, backgroundColor: '#FFFBEB' },
  vehicleCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleThumb: { width: 80, height: 60, borderRadius: 10 },
  vehicleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  vehicleName: { fontSize: 15, fontWeight: '900', color: '#111827' },
  capacityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  capacityText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  vehicleDesc: { fontSize: 11, color: '#6B7280' },
  vehiclePrice: { alignItems: 'flex-end' },
  vehiclePriceVal: { fontSize: 18, fontWeight: '900', color: '#111827' },
  vehiclePriceLbl: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },

  // Categories
  catRow: { flexDirection: 'row', gap: 10 },
  catCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  catLabel: { fontSize: 12, fontWeight: '900', color: '#374151' },
  catDesc: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },

  // Price summary
  priceSummary: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLbl: { fontSize: 12, color: '#6B7280' },
  priceVal: { fontSize: 12, fontWeight: '700', color: '#111827' },
  priceTotalRow: {
    paddingTop: 12, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', marginBottom: 0,
  },
  priceTotalLbl: { fontSize: 14, fontWeight: '800', color: '#111827' },
  priceTotalVal: { fontSize: 22, fontWeight: '900', color: BLACK },

  // Footer
  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  reserveBtn: {
    backgroundColor: BLACK, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40, shadowRadius: 12, elevation: 6,
    borderWidth: 1, borderColor: GOLD,
  },
  reserveBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  reserveBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});
