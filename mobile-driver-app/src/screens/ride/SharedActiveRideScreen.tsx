/**
 * SharedActiveRideScreen — Viaje Compartido activo
 *
 * Muestra:
 *  - Día y hora del viaje
 *  - Lista de pasajeros con su orden de recogida y entrega
 *  - Mapa con ruta completa
 *  - Estado de cada parada (pendiente / recogido / entregado)
 *  - Botón de avance por parada
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { hapticSuccess, hapticHeavy } from '../../utils/haptics';

const NAVY   = '#0033A0';
const YELLOW = '#FFCD00';
const GREEN  = '#059669';
const RED    = '#DC2626';

type SharedPassenger = {
  id: string;
  name: string;
  rating: number;
  pickupAddress: string;
  dropoffAddress: string;
  paymentMethod: 'cash' | 'card' | 'wallet';
  fare: number;
  /** order in pickup sequence */
  pickupOrder: number;
};

export type SharedActiveRideParams = {
  rideId: string;
  rideDate: string;          // ISO string, e.g. "2026-04-14T08:30:00"
  passengers: SharedPassenger[];
  totalFare: number;
};

type Nav   = NativeStackNavigationProp<DriverMainStackParamList, 'SharedActiveRide'>;
type Route = RouteProp<DriverMainStackParamList, 'SharedActiveRide'>;

type StopStatus = 'pending' | 'arrived' | 'picked_up' | 'dropped_off';

type Stop = {
  passengerId: string;
  passengerName: string;
  type: 'pickup' | 'dropoff';
  address: string;
  status: StopStatus;
  fare?: number;
  paymentMethod?: 'cash' | 'card' | 'wallet';
};

function formatRideDate(iso: string) {
  try {
    const d = new Date(iso);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return {
      day: `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`,
      time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { day: '', time: '' };
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  cash:   'Efectivo',
  card:   'Tarjeta',
  wallet: 'Wallet',
};

const PAYMENT_COLORS: Record<string, string> = {
  cash:   '#065F46',
  card:   '#1E3A8A',
  wallet: '#5B21B6',
};

const PAYMENT_BG: Record<string, string> = {
  cash:   '#D1FAE5',
  card:   '#EFF6FF',
  wallet: '#EDE9FE',
};

export function SharedActiveRideScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { rideId, rideDate, passengers, totalFare } = params;

  // Build stop list: all pickups in order, then all dropoffs in order
  const buildStops = (): Stop[] => {
    const pickups = [...passengers]
      .sort((a, b) => a.pickupOrder - b.pickupOrder)
      .map(p => ({
        passengerId: p.id,
        passengerName: p.name,
        type: 'pickup' as const,
        address: p.pickupAddress,
        status: 'pending' as StopStatus,
        fare: p.fare,
        paymentMethod: p.paymentMethod,
      }));

    const dropoffs = [...passengers]
      .sort((a, b) => a.pickupOrder - b.pickupOrder)
      .map(p => ({
        passengerId: p.id,
        passengerName: p.name,
        type: 'dropoff' as const,
        address: p.dropoffAddress,
        status: 'pending' as StopStatus,
        fare: p.fare,
        paymentMethod: p.paymentMethod,
      }));

    return [...pickups, ...dropoffs];
  };

  const [stops, setStops] = useState<Stop[]>(buildStops());
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const { day, time } = formatRideDate(rideDate);

  const currentStop = stops[currentStopIdx];
  const allDone = stops.every(s => s.status === 'dropped_off' || s.status === 'picked_up');
  const rideComplete = stops.filter(s => s.type === 'dropoff').every(s => s.status === 'dropped_off');

  const advanceStop = () => {
    if (!currentStop) return;

    const isCash = currentStop.paymentMethod === 'cash' && currentStop.type === 'dropoff';
    if (isCash) {
      const fare = currentStop.fare?.toFixed(2) ?? '0.00';
      Alert.alert(
        '¿Recibiste el pago?',
        `¿Recibiste $${fare} en efectivo de ${currentStop.passengerName}?`,
        [
          {
            text: 'No recibí el pago',
            style: 'destructive',
            onPress: () => completeStop(false),
          },
          {
            text: `Sí, recibí $${fare}`,
            onPress: () => completeStop(true),
          },
        ]
      );
    } else {
      completeStop(true);
    }
  };

  const completeStop = (cashConfirmed = false) => {
    hapticSuccess();
    setStops(prev => {
      const updated = [...prev];
      updated[currentStopIdx] = {
        ...updated[currentStopIdx],
        status: currentStop.type === 'pickup' ? 'picked_up' : 'dropped_off',
      };
      return updated;
    });

    const nextIdx = currentStopIdx + 1;
    if (nextIdx < stops.length) {
      setCurrentStopIdx(nextIdx);
    } else {
      // All stops done
      Alert.alert(
        '¡Viaje completado!',
        `Completaste todos los ${passengers.length} pasajeros del viaje compartido.`,
        [{ text: 'Ver resumen', onPress: () => navigation.popToTop() }]
      );
    }
  };

  const statusIcon = (s: StopStatus, type: 'pickup' | 'dropoff') => {
    if (s === 'dropped_off') return 'checkmark-circle';
    if (s === 'picked_up')   return 'checkmark-circle';
    return type === 'pickup' ? 'person-add-outline' : 'location-outline';
  };

  const statusColor = (s: StopStatus) => {
    if (s === 'dropped_off' || s === 'picked_up') return GREEN;
    return '#9CA3AF';
  };

  const stopLabel = (stop: Stop, idx: number) => {
    const isActive = idx === currentStopIdx;
    const isDone = stop.status === 'picked_up' || stop.status === 'dropped_off';
    return {
      isActive,
      isDone,
    };
  };

  const actionLabel = () => {
    if (!currentStop) return 'Viaje completado';
    if (currentStop.type === 'pickup') {
      return `Recoger a ${currentStop.passengerName}`;
    }
    return `Entregar a ${currentStop.passengerName}`;
  };

  return (
    <View style={styles.container}>
      {/* ── Mapa placeholder ── */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapLabel}>
          <Ionicons name="map-outline" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.mapLabelText}>Mapa Mapbox</Text>
        </View>
      </View>

      {/* ── Bottom sheet ── */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* Date & time banner */}
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color={NAVY} />
              <Text style={styles.dateText}>{day}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color={NAVY} />
              <Text style={styles.timeText}>{time}</Text>
            </View>
            <View style={styles.fareBadge}>
              <Text style={styles.fareText}>${totalFare.toFixed(2)} total</Text>
            </View>
          </View>

          {/* Pasajeros */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="people-outline" size={14} color={NAVY} />
            {'  '}Pasajeros ({passengers.length})
          </Text>
          {passengers.map(p => (
            <View key={p.id} style={styles.passengerCard}>
              <View style={styles.passengerAvatar}>
                <Ionicons name="person" size={18} color={NAVY} />
              </View>
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>{p.name}</Text>
                <View style={styles.passengerMeta}>
                  <Ionicons name="star" size={10} color={YELLOW} />
                  <Text style={styles.passengerRating}>{p.rating.toFixed(1)}</Text>
                  <View style={[styles.payBadge, { backgroundColor: PAYMENT_BG[p.paymentMethod] }]}>
                    <Text style={[styles.payBadgeText, { color: PAYMENT_COLORS[p.paymentMethod] }]}>
                      {PAYMENT_LABELS[p.paymentMethod]} · ${p.fare.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>#{p.pickupOrder}</Text>
              </View>
            </View>
          ))}

          {/* Orden de paradas */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="navigate-outline" size={14} color={NAVY} />
            {'  '}Ruta de paradas
          </Text>
          <View style={styles.stopsList}>
            {stops.map((stop, idx) => {
              const { isActive, isDone } = stopLabel(stop, idx);
              return (
                <View key={`${stop.passengerId}-${stop.type}`} style={styles.stopItem}>
                  {/* Connector line */}
                  {idx < stops.length - 1 && (
                    <View style={[styles.connector, isDone && styles.connectorDone]} />
                  )}

                  {/* Stop dot */}
                  <View style={[
                    styles.stopDot,
                    isActive && styles.stopDotActive,
                    isDone && styles.stopDotDone,
                  ]}>
                    <Ionicons
                      name={statusIcon(stop.status, stop.type)}
                      size={14}
                      color={isDone ? '#fff' : isActive ? '#fff' : '#9CA3AF'}
                    />
                  </View>

                  {/* Stop info */}
                  <View style={styles.stopInfo}>
                    <View style={styles.stopHeader}>
                      <View style={[
                        styles.stopTypeBadge,
                        stop.type === 'pickup'
                          ? { backgroundColor: '#EFF6FF' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}>
                        <Text style={[
                          styles.stopTypeText,
                          { color: stop.type === 'pickup' ? NAVY : '#92400E' },
                        ]}>
                          {stop.type === 'pickup' ? '↑ Recogida' : '↓ Entrega'}
                        </Text>
                      </View>
                      <Text style={styles.stopPassenger}>{stop.passengerName}</Text>
                    </View>
                    <Text style={styles.stopAddress} numberOfLines={2}>{stop.address}</Text>
                    {isDone && (
                      <Text style={styles.stopDoneLabel}>
                        {stop.type === 'pickup' ? '✓ Recogido' : '✓ Entregado'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Action button ── */}
        {!rideComplete ? (
          <TouchableOpacity style={styles.actionBtn} onPress={advanceStop}>
            <Text style={styles.actionBtnText}>{actionLabel()}</Text>
            <Ionicons name="arrow-forward" size={18} color={NAVY} />
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={styles.completedText}>¡Viaje compartido completado!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB' },

  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#C8D8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.5 },
  mapLabelText: { color: '#fff', fontSize: 12 },

  // Bottom sheet
  sheet: {
    maxHeight: '65%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },

  // Date row
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dateText: { fontSize: 11, fontWeight: '700', color: NAVY },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeText: { fontSize: 11, fontWeight: '700', color: NAVY },
  fareBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  fareText: { fontSize: 11, fontWeight: '800', color: GREEN },

  // Section title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Passenger cards
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  passengerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  passengerMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  passengerRating: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  payBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  payBadgeText: { fontSize: 9, fontWeight: '700' },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { fontSize: 10, fontWeight: '900', color: YELLOW },

  // Stops list
  stopsList: { paddingLeft: 4, marginBottom: 12 },
  stopItem: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    paddingBottom: 16,
  },
  connector: {
    position: 'absolute',
    left: 13,
    top: 26,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  connectorDone: { backgroundColor: GREEN },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  stopDotActive: { backgroundColor: NAVY },
  stopDotDone: { backgroundColor: GREEN },
  stopInfo: { flex: 1, paddingTop: 3 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stopTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stopTypeText: { fontSize: 9, fontWeight: '800' },
  stopPassenger: { fontSize: 11, fontWeight: '700', color: '#111827' },
  stopAddress: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
  stopDoneLabel: { fontSize: 10, color: GREEN, fontWeight: '700', marginTop: 2 },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: YELLOW,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  actionBtnText: { color: NAVY, fontSize: 14, fontWeight: '900' },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completedText: { color: GREEN, fontSize: 14, fontWeight: '800' },
});
