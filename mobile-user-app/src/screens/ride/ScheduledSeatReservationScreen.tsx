/**
 * ScheduledSeatReservationScreen — pantalla intermedia entre
 * BookingOptionsScreen (al tap scheduled) y ConfirmRideScreen.
 *
 * Permite al usuario:
 *   - Ver detalles del viaje (conductor, vehículo, hora, capacidad)
 *   - Escoger número de asientos (1..availableSeats, máx 5 por reserva)
 *   - Marcar opción de grupo / asiento delantero exclusivo (+$3)
 *   - Ver totalPrice = pricePerSeat × seats (+ frontSeat surcharge)
 *
 * Output: navega a ConfirmRide con seats real + totalPrice calculado.
 * La reserva real (POST /scheduled-trips/:id/reserve) la hace ConfirmRide.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export type ScheduledSeatReservationParams = {
  /** ScheduledTrip ID — al confirmar lo pasamos a ConfirmRide. */
  scheduledTripId: string;
  /** city IDs FARES — necesarios para reserve. */
  originCity: string;
  destCity: string;
  routeLabel: string;
  /** Origen/destino que mostraremos en ConfirmRide (address libre). */
  pickup: { latitude: number; longitude: number; address?: string };
  destination: { latitude: number; longitude: number; address?: string };
  /** ISO 8601 — hora de salida. */
  departureTime: string;
  /** Cupos disponibles según el último /search. */
  availableSeats: number;
  /** Precio base por asiento. */
  pricePerSeat: number;
  /** Modelo de vehículo si el response lo trajo. */
  vehicleModel?: string;
  driver?: { name?: string; rating?: number };
};

/** +$3 surcharge si el user reserva el asiento delantero con exclusividad. */
const FRONT_SEAT_SURCHARGE = 3;
/** Tope por reserva — backend valida lo mismo. */
const MAX_SEATS_PER_RESERVATION = 5;

export function ScheduledSeatReservationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<{ params: ScheduledSeatReservationParams }, 'params'>>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const p = route.params;
  const [seats, setSeats] = useState(1);
  const [frontSeat, setFrontSeat] = useState(false);

  const maxSeats = useMemo(
    () => Math.min(p.availableSeats, MAX_SEATS_PER_RESERVATION),
    [p.availableSeats],
  );

  const totalPrice = useMemo(() => {
    let total = p.pricePerSeat * seats;
    if (frontSeat && seats === 1) total += FRONT_SEAT_SURCHARGE;
    return Math.round(total * 100) / 100;
  }, [p.pricePerSeat, seats, frontSeat]);

  const adjustSeats = useCallback((delta: number) => {
    setSeats((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxSeats) return maxSeats;
      // frontSeat solo aplica con 1 asiento — si subimos a 2+, apagamos.
      if (next > 1) setFrontSeat(false);
      return next;
    });
    hapticLight();
  }, [maxSeats]);

  const handleConfirm = useCallback(() => {
    if (seats < 1) {
      Alert.alert('Selecciona al menos 1 asiento');
      return;
    }
    hapticLight();
    navigation.navigate('ConfirmRide', {
      type:          'compartido',
      tripId:        p.scheduledTripId,
      origin:        p.pickup.address ?? p.routeLabel,
      originCoords:  { lat: p.pickup.latitude, lng: p.pickup.longitude },
      destination:   p.destination.address ?? p.routeLabel,
      destCoords:    { lat: p.destination.latitude, lng: p.destination.longitude },
      departureTime: p.departureTime,
      vehicle:       p.vehicleModel ?? 'Compartido',
      pricePerSeat:  p.pricePerSeat,
      seats,
      frontSeat:     frontSeat && seats === 1,
      totalPrice,
      capacity:      p.availableSeats,
      originCity:    p.originCity,
      destCity:      p.destCity,
    });
  }, [navigation, p, seats, frontSeat, totalPrice]);

  // ── Render ──────────────────────────────────────────────────────────
  const departure = useMemo(
    () => new Date(p.departureTime).toLocaleString('es-EC', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    }),
    [p.departureTime],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card del viaje */}
        <View style={styles.tripCard}>
          <View style={styles.routeRow}>
            <Ionicons name="people" size={20} color={tokens.brandNavy} />
            <Text style={styles.routeLabel}>{p.routeLabel}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={tokens.textSecondary} />
            <Text style={styles.metaText}>{departure}</Text>
          </View>
          {p.vehicleModel && (
            <View style={styles.metaRow}>
              <Ionicons name="car-outline" size={16} color={tokens.textSecondary} />
              <Text style={styles.metaText}>{p.vehicleModel}</Text>
            </View>
          )}
          {p.driver?.rating != null && (
            <View style={styles.metaRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>
                {p.driver.rating.toFixed(1)} de calificación
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={tokens.textSecondary} />
            <Text style={styles.metaText}>
              {p.availableSeats} cupo{p.availableSeats !== 1 ? 's' : ''} disponible{p.availableSeats !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Selector de asientos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cuántos asientos?</Text>
          <Text style={styles.sectionHint}>
            Máximo {MAX_SEATS_PER_RESERVATION} por reserva
          </Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterBtn, seats <= 1 && styles.counterBtnDisabled]}
              onPress={() => adjustSeats(-1)}
              disabled={seats <= 1}
            >
              <Ionicons name="remove" size={24} color={tokens.brandNavy} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{seats}</Text>
            <TouchableOpacity
              style={[styles.counterBtn, seats >= maxSeats && styles.counterBtnDisabled]}
              onPress={() => adjustSeats(1)}
              disabled={seats >= maxSeats}
            >
              <Ionicons name="add" size={24} color={tokens.brandNavy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Asiento delantero exclusivo (solo si seats=1) */}
        {seats === 1 && (
          <TouchableOpacity
            style={[styles.toggleRow, frontSeat && styles.toggleRowActive]}
            onPress={() => { setFrontSeat((v) => !v); hapticLight(); }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Asiento delantero (+$3)</Text>
              <Text style={styles.toggleHint}>
                Viaja al lado del conductor con espacio garantizado
              </Text>
            </View>
            <View style={[styles.checkbox, frontSeat && styles.checkboxActive]}>
              {frontSeat && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
          </TouchableOpacity>
        )}

        {/* Resumen precio */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Asientos ({seats} × ${p.pricePerSeat.toFixed(2)})</Text>
            <Text style={styles.priceValue}>${(p.pricePerSeat * seats).toFixed(2)}</Text>
          </View>
          {frontSeat && seats === 1 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Asiento delantero</Text>
              <Text style={styles.priceValue}>+${FRONT_SEAT_SURCHARGE.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.priceRowTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleConfirm}>
          <Text style={styles.ctaText}>Continuar al pago</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, _isDark: boolean) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.bg },
    scrollContent:{ padding: 16, paddingBottom: 40 },
    tripCard: {
      backgroundColor: t.bgLayer, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: t.border, marginBottom: 16,
    },
    routeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    routeLabel:  { fontSize: 18, fontWeight: '700', color: t.textPrimary },
    metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText:    { fontSize: 14, color: t.textSecondary },
    section:     {
      backgroundColor: t.bgLayer, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: t.border, marginBottom: 16,
    },
    sectionTitle:{ fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    sectionHint: { fontSize: 13, color: t.textSecondary, marginBottom: 16 },
    counterRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
    counterBtn:  {
      width: 48, height: 48, borderRadius: 24, borderWidth: 2,
      borderColor: t.brandNavy, alignItems: 'center', justifyContent: 'center',
    },
    counterBtnDisabled: { borderColor: t.border, opacity: 0.4 },
    counterValue:{ fontSize: 32, fontWeight: '700', color: t.textPrimary, minWidth: 60, textAlign: 'center' },
    toggleRow:   {
      backgroundColor: t.bgLayer, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: t.border, marginBottom: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    toggleRowActive: { borderColor: t.brandNavy, borderWidth: 2 },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
    toggleHint:  { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    checkbox:    {
      width: 24, height: 24, borderRadius: 6, borderWidth: 2,
      borderColor: t.border, alignItems: 'center', justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: t.brandNavy, borderColor: t.brandNavy },
    priceCard:   {
      backgroundColor: t.bgLayer, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: t.border,
    },
    priceRow:    { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    priceLabel:  { fontSize: 14, color: t.textSecondary },
    priceValue:  { fontSize: 14, color: t.textPrimary, fontWeight: '500' },
    priceRowTotal: {
      marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border,
    },
    totalLabel:  { fontSize: 16, fontWeight: '700', color: t.textPrimary },
    totalValue:  { fontSize: 20, fontWeight: '700', color: t.brandNavy },
    footer:      {
      padding: 16, borderTopWidth: 1, borderTopColor: t.border,
      backgroundColor: t.bg,
    },
    cta:         {
      backgroundColor: t.brandNavy, borderRadius: 12, paddingVertical: 14,
      alignItems: 'center',
    },
    ctaText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
