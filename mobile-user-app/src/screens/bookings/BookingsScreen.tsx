import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { bookingsAPI } from '@services/api';
import { SkeletonTripCard } from '@components/Skeleton';
import { EmptyState, EMPTY_STATES } from '@components/EmptyState';

type Nav = NativeStackNavigationProp<MainStackParamList>;

interface Booking {
  id: string;
  type: string;
  status: 'completed' | 'active' | 'cancelled' | 'pending';
  origin?: string;
  destination?: string;
  date: string;
  amount?: number;
}

const STATUS_CONFIG = {
  completed: {
    label: 'Completado',
    color: '#059669',
    bg: '#ECFDF5',
    icon: 'checkmark-circle',
  },
  active: {
    label: 'Activo',
    color: '#0033A0',
    bg: '#EFF6FF',
    icon: 'radio-button-on',
  },
  pending: {
    label: 'Pendiente',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: 'time',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'close-circle',
  },
};

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const { data } = await bookingsAPI.getAll();
      setBookings(data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const renderItem = ({ item }: { item: Booking }) => {
    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TripDetail', { bookingId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon as any} size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('es-EC', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        {item.origin && (
          <View style={styles.route}>
            <Ionicons name="ellipse" size={10} color="#0033A0" />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.origin}
            </Text>
          </View>
        )}
        {item.destination && (
          <View style={styles.route}>
            <Ionicons name="location" size={14} color="#FFCD00" />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        )}
        {item.amount != null && (
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: 16, gap: 0 }}>
          {[1, 2, 3, 4].map(i => <SkeletonTripCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          bookings.length === 0 ? styles.center : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor="#0033A0"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            {...EMPTY_STATES.bookings}
            ctaLabel="Reservar mi primer viaje"
            onCta={() => navigation.goBack()}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: '#9CA3AF' },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  routeText: { flex: 1, fontSize: 14, color: '#374151' },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0033A0',
    marginTop: 8,
    textAlign: 'right',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 2,
  },
  cardFooterText: { fontSize: 12, color: '#9CA3AF' },
});
