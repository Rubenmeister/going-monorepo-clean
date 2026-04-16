import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonTripDetail } from '@components/Skeleton';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { bookingsAPI, parcelsAPI, ridesAPI } from '@services/api';

export type TripDetailParams = {
  bookingId: string;
  type?: 'ride' | 'envio' | 'booking';
};
type TripDetailRouteProp = RouteProp<MainStackParamList, 'TripDetail'>;

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  completed: { label: 'Completado', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
  active:    { label: 'Activo',     color: GOING_BLUE, bg: '#EFF6FF', icon: 'radio-button-on' },
  pending:   { label: 'Pendiente',  color: '#D97706',  bg: '#FFFBEB', icon: 'time' },
  cancelled: { label: 'Cancelado',  color: '#DC2626',  bg: '#FEF2F2', icon: 'close-circle' },
};

interface TripDetail {
  id: string;
  type?: string;
  status: string;
  origin?: string;
  destination?: string;
  date: string;
  amount?: number;
  driverName?: string;
  driverRating?: number;
  vehicle?: string;
  duration?: number;
  distance?: number;
  mode?: string;
  category?: string;
}

export function TripDetailScreen() {
  const { params } = useRoute<TripDetailRouteProp>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let raw: any;
        if (params.type === 'envio') {
          const { data } = await parcelsAPI.getById(params.bookingId);
          const p = data.data ?? data;
          raw = {
            id:          p.id,
            type:        'envio',
            status:      p.status === 'delivered' ? 'completed' : p.status === 'cancelled' ? 'cancelled' : p.status === 'in_transit' ? 'active' : 'pending',
            origin:      p.origin?.address,
            destination: p.destination?.address,
            date:        p.createdAt ?? new Date().toISOString(),
            amount:      p.price?.amount ?? p.estimatedPrice,
          };
        } else if (params.type === 'ride') {
          const { data } = await ridesAPI.getById(params.bookingId);
          const r = data.data ?? data;
          raw = {
            id:           r.id ?? r.rideId,
            type:         'ride',
            status:       r.status === 'completed' ? 'completed' : r.status === 'cancelled' ? 'cancelled' : 'active',
            origin:       r.origin?.address,
            destination:  r.destination?.address,
            date:         r.createdAt ?? r.startTime ?? new Date().toISOString(),
            amount:       r.price?.amount ?? r.amount,
            driverName:   r.driver?.name ?? r.driverName,
            driverRating: r.driver?.rating ?? r.driverRating,
            vehicle:      r.vehicle?.plate ?? r.vehicle,
            duration:     r.durationMinutes,
            distance:     r.distanceKm,
            mode:         r.mode,
          };
        } else {
          const { data } = await bookingsAPI.getById(params.bookingId);
          raw = data.data ?? data;
        }
        setTrip(raw);
      } catch {
        // fallback with minimal data from params
        setTrip({
          id: params.bookingId,
          status: 'completed',
          date: new Date().toISOString(),
          type: params.type ?? 'booking',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [params.bookingId, params.type]);

  if (loading) {
    return <ScrollView><SkeletonTripDetail /></ScrollView>;
  }

  if (!trip) return null;

  const st = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.completed;

  const handleShare = async () => {
    await Share.share({
      message: `Mi viaje Going\n${trip.origin ? `Desde: ${trip.origin}\n` : ''}${
        trip.destination ? `Hasta: ${trip.destination}\n` : ''
      }Estado: ${st.label}${trip.amount != null ? `\nTotal: $${trip.amount.toFixed(2)}` : ''}`,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status hero */}
      <View style={styles.hero}>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={16} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
        {trip.amount != null && (
          <Text style={styles.amount}>${trip.amount.toFixed(2)}</Text>
        )}
        <Text style={styles.dateText}>
          {new Date(trip.date).toLocaleDateString('es-EC', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Route */}
      {(trip.origin || trip.destination) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruta</Text>
          {trip.origin && (
            <View style={styles.routeRow}>
              <View style={styles.dotBlue} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Origen</Text>
                <Text style={styles.routeAddr}>{trip.origin}</Text>
              </View>
            </View>
          )}
          {trip.origin && trip.destination && (
            <View style={styles.routeLine} />
          )}
          {trip.destination && (
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color={GOING_YELLOW} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeAddr}>{trip.destination}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Trip details grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles del viaje</Text>
        <View style={styles.detailsGrid}>
          {trip.vehicle && (
            <DetailItem icon="car-outline" label="Vehículo" value={trip.vehicle} />
          )}
          {trip.mode && (
            <DetailItem
              icon="people-outline"
              label="Modalidad"
              value={trip.mode === 'compartido' ? 'Compartido' : 'Privado'}
            />
          )}
          {trip.category && (
            <DetailItem icon="ribbon-outline" label="Categoría" value={trip.category} />
          )}
          {trip.duration != null && (
            <DetailItem icon="time-outline" label="Duración" value={`${trip.duration} min`} />
          )}
          {trip.distance != null && (
            <DetailItem icon="map-outline" label="Distancia" value={`${trip.distance} km`} />
          )}
        </View>
      </View>

      {/* Driver info */}
      {trip.driverName && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conductor</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {trip.driverName[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{trip.driverName}</Text>
              {trip.driverRating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={GOING_YELLOW} />
                  <Text style={styles.driverRating}>
                    {trip.driverRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Share button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Ionicons name="share-outline" size={18} color={GOING_BLUE} />
        <Text style={styles.shareBtnText}>Compartir resumen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={GOING_BLUE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: GOING_BLUE,
    padding: 28,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 14,
  },
  statusText: { fontSize: 14, fontWeight: '800' },
  amount: {
    color: GOING_YELLOW,
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 6,
  },
  dateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dotBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOING_BLUE,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  routeLine: {
    height: 20,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  routeAddr: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 2 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { flex: 1, fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 20, fontWeight: '800', color: GOING_BLUE },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  shareBtnText: { color: GOING_BLUE, fontSize: 15, fontWeight: '700' },
});
