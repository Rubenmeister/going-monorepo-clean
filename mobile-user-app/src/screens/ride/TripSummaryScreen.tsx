/**
 * TripSummaryScreen — Resumen del viaje finalizado (Pasajero)
 *
 * Se muestra cuando el conductor emite ride:completed.
 * Flujo:
 *  1. Confirmación visual (✓ verde · monto · referencia)
 *  2. Detalles del viaje (ruta, duración, distancia, conductor)
 *  3. Si fue efectivo → banner "Efectivo confirmado por el conductor"
 *  4. Botón → RateDriverScreen
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { hapticSuccess } from '../../utils/haptics';

const GREEN      = '#059669';
const DARK_GREEN = '#065F46';
const GOLD       = '#FFCD00';
const NAVY       = '#0033A0';

// ── Params ────────────────────────────────────────────────────────────────────
export type TripSummaryParams = {
  rideId:          string;
  driverId:        string;
  driverName:      string;
  origin:          string;
  destination:     string;
  departureTime?:  string;
  arrivalTime?:    string;
  durationSeconds?: number;
  distanceKm?:     number;
  fare:            number;
  paymentMethod:   'card' | 'cash' | 'wallet' | string;
  cashConfirmed?:  boolean;
  vehiclePlate?:   string;
  vehicleModel?:   string;
  rideType:        'compartido' | 'privado';
  referenceCode?:  string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─────────────────────────────────────────────────────────────────────────────

export function TripSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: TripSummaryParams }, 'params'>>();
  const p          = route.params;

  useEffect(() => {
    hapticSuccess();
  }, []);

  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const m = Math.round(secs / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Acabo de llegar a ${p.destination} con Going. Excelente servicio 🚗`,
      });
    } catch {}
  };

  const handleRate = () => {
    navigation.replace('RateDriver', {
      rideId:          p.rideId,
      driverId:        p.driverId,
      driverName:      p.driverName,
      fare:            p.fare,
      distanceKm:      p.distanceKm,
      durationSeconds: p.durationSeconds,
      paymentMethod:   p.paymentMethod,
    });
  };

  const durationLabel = formatDuration(p.durationSeconds);
  const methodLabel   = p.paymentMethod === 'cash' ? 'Efectivo'
    : p.paymentMethod === 'wallet' ? 'Wallet Going'
    : 'Tarjeta';

  return (
    <View style={styles.container}>

      {/* ── HERO verde ───────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="checkmark-circle" size={36} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>¡Llegaste!</Text>
        <Text style={styles.heroSub}>Viaje completado exitosamente</Text>

        <Text style={styles.heroAmount}>${p.fare.toFixed(2)}</Text>
        <Text style={styles.heroCurrency}>USD · {methodLabel}</Text>

        {p.referenceCode && (
          <View style={styles.refBadge}>
            <Text style={styles.refText}>#{p.referenceCode}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Detalles del viaje ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DETALLES DEL VIAJE</Text>

          {/* Ruta */}
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: GREEN }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeCity}>{p.origin}</Text>
            </View>
            {p.departureTime && <Text style={styles.routeTime}>{p.departureTime}</Text>}
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#9CA3AF' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeCity}>{p.destination}</Text>
            </View>
            {p.arrivalTime && <Text style={styles.routeTime}>{p.arrivalTime}</Text>}
          </View>

          <View style={styles.divider} />

          {/* Stats */}
          {durationLabel && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Duración</Text>
              <Text style={styles.statVal}>{durationLabel}</Text>
            </View>
          )}
          {p.distanceKm && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Distancia</Text>
              <Text style={styles.statVal}>{p.distanceKm.toFixed(1)} km</Text>
            </View>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statLbl}>Conductor</Text>
            <Text style={styles.statVal}>{p.driverName}</Text>
          </View>
          {p.vehiclePlate && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Vehículo</Text>
              <Text style={styles.statVal}>
                {p.vehicleModel ? `${p.vehicleModel} · ` : ''}{p.vehiclePlate}
              </Text>
            </View>
          )}
          <View style={[styles.statRow, { marginBottom: 0 }]}>
            <Text style={styles.statLbl}>Tipo de viaje</Text>
            <Text style={styles.statVal}>
              {p.rideType === 'compartido' ? '🤝 Compartido' : '🔒 Privado'}
            </Text>
          </View>
        </View>

        {/* ── Efectivo confirmado ──────────────────────────────────────── */}
        {p.paymentMethod === 'cash' && (
          <View style={[styles.cashBanner, p.cashConfirmed && styles.cashBannerConfirmed]}>
            <Ionicons
              name={p.cashConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={22}
              color={p.cashConfirmed ? '#059669' : '#D97706'}
            />
            <Text style={[styles.cashText, p.cashConfirmed && { color: '#065F46' }]}>
              {p.cashConfirmed
                ? `Efectivo confirmado por ${p.driverName.split(' ')[0]}`
                : 'Pendiente confirmación de efectivo por el conductor'}
            </Text>
            {p.cashConfirmed && (
              <View style={styles.cashCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
        )}

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={NAVY} />
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="receipt-outline" size={20} color={NAVY} />
            <Text style={styles.actionText}>Recibo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="headset-outline" size={20} color={NAVY} />
            <Text style={styles.actionText}>Soporte</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── BOTÓN CALIFICAR ──────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.rateBtn} onPress={handleRate} activeOpacity={0.85}>
          <View>
            <Text style={styles.rateBtnText}>Calificar a {p.driverName.split(' ')[0]}</Text>
            <Text style={styles.rateBtnSub}>¿Cómo estuvo tu viaje?</Text>
          </View>
          <Ionicons name="star" size={24} color={GOLD} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.navigate('Home' as any)}
        >
          <Text style={styles.skipText}>Ir al inicio</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Hero
  hero: {
    backgroundColor: GREEN,
    paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
    alignItems: 'center', gap: 6,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle:    { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroSub:      { fontSize: 12, color: 'rgba(255,255,255,0.70)' },
  heroAmount:   { fontSize: 40, fontWeight: '900', color: '#fff', marginTop: 8 },
  heroCurrency: { fontSize: 13, color: 'rgba(255,255,255,0.70)' },
  refBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
    marginTop: 4,
  },
  refText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  // Scroll
  scroll: { flex: 1 },

  // Card
  card: {
    margin: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },

  // Route
  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeCity: { fontSize: 15, fontWeight: '800', color: '#111827' },
  routeTime: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  routeLine: { width: 2, height: 16, backgroundColor: '#D1FAE5', marginLeft: 4, marginVertical: 3 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  // Stats
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLbl: { fontSize: 13, color: '#6B7280' },
  statVal: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Cash banner
  cashBanner: {
    marginHorizontal: 16, marginBottom: 0,
    backgroundColor: '#FEF3C7', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#FDE68A',
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  cashBannerConfirmed: {
    backgroundColor: '#ECFDF5', borderColor: '#6EE7B7',
  },
  cashText:  { flex: 1, fontSize: 12, fontWeight: '700', color: '#92400E' },
  cashCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
  },

  // Actions row
  actionsRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginTop: 14,
  },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: NAVY },

  // Footer
  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8,
  },
  rateBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 6,
  },
  rateBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  rateBtnSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  skipBtn:     { alignItems: 'center', paddingVertical: 8 },
  skipText:    { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
});
