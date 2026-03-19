import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, EMPTY_STATES } from '@components/EmptyState';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

interface TripRecord {
  id: string;
  passengerName?: string;
  origin?: string;
  destination?: string;
  date: string;
  amount: number;
  status: 'completed' | 'cancelled' | 'no_show';
  duration?: number;
  vehicle?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: 'Completado', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelado',  color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle' },
  no_show:   { label: 'No presentó', color: '#D97706', bg: '#FFFBEB', icon: 'warning' },
};

type FilterType = 'all' | 'completed' | 'cancelled';

export function TripHistoryScreen() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const { data } = await axios.get(`${API_BASE}/drivers/me/trips`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, limit: 50 },
      });
      setTrips(data.data ?? []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const totalEarnings = trips
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = filter === 'all' ? trips : trips.filter((t) => t.status === filter);

  const renderItem = ({ item }: { item: TripRecord }) => {
    const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.completed;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon as any} size={12} color={st.color} />
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('es-EC', {
              day: '2-digit',
              month: 'short',
            })}
          </Text>
          {item.status === 'completed' && (
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          )}
        </View>

        {item.passengerName && (
          <View style={styles.passengerRow}>
            <Ionicons name="person-outline" size={14} color="#9CA3AF" />
            <Text style={styles.passengerName}>{item.passengerName}</Text>
          </View>
        )}

        {item.origin && (
          <View style={styles.routeRow}>
            <View style={styles.dotBlue} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.origin}
            </Text>
          </View>
        )}
        {item.destination && (
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color={GOING_YELLOW} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        )}

        {item.duration != null && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.duration} min</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOING_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{trips.length}</Text>
          <Text style={styles.summaryLabel}>Viajes totales</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: GOING_YELLOW }]}>
            ${totalEarnings.toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Ganancias</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {trips.filter((t) => t.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completados</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'completed', 'cancelled'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Cancelados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          filtered.length === 0 ? styles.center : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={GOING_BLUE}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin viajes aún</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus viajes completados
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: {
    backgroundColor: GOING_BLUE,
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  filters: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: GOING_BLUE, borderColor: GOING_BLUE },
  filterText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { flex: 1, fontSize: 12, color: '#9CA3AF' },
  amount: { fontSize: 16, fontWeight: '900', color: '#059669' },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  passengerName: { fontSize: 13, color: '#374151', fontWeight: '600' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  dotBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOING_BLUE,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  routeText: { flex: 1, fontSize: 13, color: '#374151' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: { fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 14 },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
