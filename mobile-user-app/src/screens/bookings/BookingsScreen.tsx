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
import { bookingsAPI, parcelsAPI, ridesAPI } from '@services/api';
import { useAuthStore } from '@store/useAuthStore';
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

type TabKey = 'todos' | 'viajes' | 'envios' | 'tours';

// ── Historial demo — Ecuador ───────────────────────────────────────────────────
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'db1',
    type: 'ride',
    status: 'completed',
    origin: 'Ambato, Terminal Terrestre',
    destination: 'Aeropuerto Quito (Tababela)',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 45,
  },
  {
    id: 'db2',
    type: 'ride',
    status: 'completed',
    origin: 'Latacunga, Parque Vicente León',
    destination: 'Quito, La Mariscal',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 18,
  },
  {
    id: 'db3',
    type: 'envio',
    status: 'completed',
    origin: 'Salcedo, Av. 24 de Mayo',
    destination: 'Quito, Cumbayá',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 12,
  },
  {
    id: 'db4',
    type: 'ride',
    status: 'cancelled',
    origin: 'Otavalo, Mercado Artesanal',
    destination: 'Ibarra, Terminal',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 0,
  },
  {
    id: 'db5',
    type: 'booking',
    status: 'completed',
    origin: undefined,
    destination: 'Tren Nariz del Diablo — Alausí',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 45,
  },
];

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState<TabKey>('todos');
  const [totalSpent, setSpent]    = useState(0);
  const [points, setPoints]       = useState(0);

  const loadBookings = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      // Load bookings (tours, accommodations, experiences) + ride history in parallel
      const [bookRes, ridesRes, parcelsRes] = await Promise.allSettled([
        bookingsAPI.getAll(),
        ridesAPI.getUserHistory(50),
        parcelsAPI.getMine(),
      ]);

      const bkList: Booking[] = bookRes.status === 'fulfilled'
        ? (bookRes.value.data?.data ?? bookRes.value.data ?? []).map((b: any) => ({
            id:          b.id,
            type:        b.serviceType ?? b.type ?? 'booking',
            status:      b.status ?? 'pending',
            origin:      b.origin?.address ?? b.origin ?? undefined,
            destination: b.destination?.address ?? b.destination ?? undefined,
            date:        b.createdAt ?? b.date ?? new Date().toISOString(),
            amount:      b.amount ?? b.price?.amount ?? undefined,
          }))
        : [];

      const rideList: Booking[] = ridesRes.status === 'fulfilled'
        ? (ridesRes.value.data?.rides ?? ridesRes.value.data ?? []).map((r: any) => ({
            id:          r.id ?? r.rideId,
            type:        'ride',
            status:      r.status === 'completed' ? 'completed' : r.status === 'cancelled' ? 'cancelled' : 'active',
            origin:      r.origin?.address ?? r.origin ?? undefined,
            destination: r.destination?.address ?? r.destination ?? undefined,
            date:        r.createdAt ?? r.startTime ?? new Date().toISOString(),
            amount:      r.price?.amount ?? r.amount ?? undefined,
          }))
        : [];

      const parcelList: Booking[] = parcelsRes.status === 'fulfilled'
        ? (parcelsRes.value.data?.parcels ?? parcelsRes.value.data ?? []).map((p: any) => ({
            id:          p.id,
            type:        'envio',
            status:      p.status === 'delivered' ? 'completed' : p.status === 'cancelled' ? 'cancelled' : p.status === 'in_transit' ? 'active' : 'pending',
            origin:      p.origin?.address ?? undefined,
            destination: p.destination?.address ?? undefined,
            date:        p.createdAt ?? new Date().toISOString(),
            amount:      p.estimatedPrice ?? undefined,
          }))
        : [];

      const all = [...rideList, ...bkList, ...parcelList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Si la API no devuelve nada, mostrar historial demo
      const finalList = all.length > 0 ? all : DEMO_BOOKINGS;
      setBookings(finalList);

      // Stats
      const spent = finalList.reduce((s, b) => s + (b.amount ?? 0), 0);
      setSpent(spent);
      setPoints(Math.round(spent * 10)); // 10 pts per $1
    } catch {
      setBookings(DEMO_BOOKINGS);
      const spent = DEMO_BOOKINGS.reduce((s, b) => s + (b.amount ?? 0), 0);
      setSpent(spent);
      setPoints(Math.round(spent * 10));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'todos',  label: 'Todos' },
    { key: 'viajes', label: 'Viajes' },
    { key: 'envios', label: 'Envíos' },
    { key: 'tours',  label: 'Tours' },
  ];

  const filtered = tab === 'todos'  ? bookings
    : tab === 'viajes' ? bookings.filter(b => b.type === 'ride')
    : tab === 'envios' ? bookings.filter(b => b.type === 'envio')
    : bookings.filter(b => !['ride','envio'].includes(b.type));

  const renderItem = ({ item }: { item: Booking }) => {
    const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TripDetail', { bookingId: item.id, type: item.type as any })}
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

  const GOING_RED = '#C0392B';

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{bookings.length}</Text>
          <Text style={styles.statLbl}>Actividades</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' }]}>
          <Text style={[styles.statVal, { color: '#F39C12' }]}>{points.toLocaleString()}</Text>
          <Text style={styles.statLbl}>Puntos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#27AE60' }]}>${totalSpent.toFixed(2)}</Text>
          <Text style={styles.statLbl}>Gastado</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLbl, tab === t.key && { color: GOING_RED }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.center : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor={GOING_RED} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState {...EMPTY_STATES.bookings} ctaLabel="Ir al inicio" onCta={() => navigation.goBack()} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },

  statsRow: { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  statCard: { flex:1, alignItems:'center', paddingVertical:12 },
  statVal: { fontSize:18, fontWeight:'900', color:'#1A1A2E' },
  statLbl: { fontSize:10, color:'#7F8C8D', marginTop:2 },

  tabsRow: { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  tabBtn: { flex:1, paddingVertical:10, alignItems:'center' },
  tabBtnActive: { borderBottomWidth:2, borderBottomColor:'#C0392B' },
  tabLbl: { fontSize:12, color:'#7F8C8D', fontWeight:'600' },
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
