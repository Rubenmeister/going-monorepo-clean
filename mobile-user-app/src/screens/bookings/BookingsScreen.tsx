/**
 * BookingsScreen — Historial de actividades del usuario (Mockup #18).
 *
 * Estructura:
 *   - Stats row: Actividades / Puntos / Gastado
 *   - Tabs: Todos / Viajes / Envíos / Tours
 *   - FlatList de bookings con status + ruta + amount + chevron
 *   - Pull to refresh
 *   - EmptyState si no hay
 *
 * Theme adaptativo light + dark.
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded GOING_RED/BLUE/YELLOW)
 *   - STATUS_CONFIG colors semánticos (success/info/warning/error tokens)
 *   - Points calc local removido — antes calculaba `spent*10` que era
 *     drift con backend real. Ahora muestra `user.points` real del store.
 *   - Tab active border en brandRed → cambiado a brandNavy (consistency)
 *
 * TODO declarado:
 *   - Endpoint /users/me/stats con totales agregados reales (en lugar
 *     de calcular del array de bookings cargados, que solo trae 50 últimos)
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
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
import { useTheme, type ThemeTokens } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

interface Booking {
  id:           string;
  type:         string;
  status:       'completed' | 'active' | 'cancelled' | 'pending';
  origin?:      string;
  destination?: string;
  date:         string;
  amount?:      number;
}

type TabKey = 'todos' | 'viajes' | 'envios' | 'tours';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos',  label: 'Todos'  },
  { key: 'viajes', label: 'Viajes' },
  { key: 'envios', label: 'Envíos' },
  { key: 'tours',  label: 'Tours'  },
];

export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<TabKey>('todos');
  const [totalSpent, setSpent]      = useState(0);

  // STATUS config con tokens semánticos
  const STATUS_CONFIG = useMemo(() => ({
    completed: { label: 'Completado', color: tokens.success, bg: `${tokens.success}14`, icon: 'checkmark-circle' as const },
    active:    { label: 'Activo',     color: tokens.brandNavy, bg: `${tokens.brandNavy}14`, icon: 'radio-button-on' as const },
    pending:   { label: 'Pendiente',  color: tokens.warning, bg: `${tokens.warning}14`, icon: 'time' as const },
    cancelled: { label: 'Cancelado',  color: tokens.error,   bg: `${tokens.error}14`,   icon: 'close-circle' as const },
  }), [tokens]);

  // Puntos reales del user (consistente con #16 Profile y #17 Puntos)
  const userPoints = (user as any)?.points ?? 0;

  const loadBookings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
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
            status:      p.status === 'delivered' ? 'completed'
                       : p.status === 'cancelled' ? 'cancelled'
                       : p.status === 'in_transit' ? 'active'
                       : 'pending',
            origin:      p.origin?.address ?? undefined,
            destination: p.destination?.address ?? undefined,
            date:        p.createdAt ?? new Date().toISOString(),
            amount:      p.estimatedPrice ?? undefined,
          }))
        : [];

      const all = [...rideList, ...bkList, ...parcelList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setBookings(all);
      // Total gastado: suma del array cargado (no totalmente accurate si
      // hay más de 50 bookings históricos pero útil para "actividad reciente")
      setSpent(all.reduce((s, b) => s + (b.amount ?? 0), 0));
    } catch {
      setBookings([]);
      setSpent(0);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const filtered = useMemo(() => {
    if (tab === 'todos')  return bookings;
    if (tab === 'viajes') return bookings.filter(b => b.type === 'ride');
    if (tab === 'envios') return bookings.filter(b => b.type === 'envio');
    return bookings.filter(b => !['ride', 'envio'].includes(b.type));
  }, [bookings, tab]);

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
            <Ionicons name={st.icon} size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('es-EC', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </Text>
        </View>

        {item.origin && (
          <View style={styles.route}>
            <Ionicons name="ellipse" size={10} color={tokens.brandNavy} />
            <Text style={styles.routeText} numberOfLines={1}>{item.origin}</Text>
          </View>
        )}
        {item.destination && (
          <View style={styles.route}>
            <Ionicons name="location" size={14} color={tokens.brandYellow} />
            <Text style={styles.routeText} numberOfLines={1}>{item.destination}</Text>
          </View>
        )}
        {item.amount != null && (
          <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={14} color={tokens.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4].map(i => <SkeletonTripCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{bookings.length}</Text>
          <Text style={styles.statLbl}>Actividades</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={[styles.statVal, { color: tokens.warning }]}>
            {userPoints.toLocaleString('es-EC')}
          </Text>
          <Text style={styles.statLbl}>Puntos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: tokens.success }]}>
            ${totalSpent.toFixed(2)}
          </Text>
          <Text style={styles.statLbl}>Gastado</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
            accessibilityLabel={`Filtrar por ${t.label}`}
          >
            <Text style={[styles.tabLbl, tab === t.key && styles.tabLblActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.center : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor={tokens.brandNavy}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            {...EMPTY_STATES.bookings}
            ctaLabel="Ir al inicio"
            onCta={() => navigation.goBack()}
          />
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16 },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: t.bgLayer,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statCardMiddle: {
      borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.border,
    },
    statVal: {
      fontSize: 18, fontWeight: '900',
      color: t.textPrimary, letterSpacing: -0.3,
    },
    statLbl: {
      fontSize: 10, color: t.textTertiary,
      marginTop: 2, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },

    tabsRow: {
      flexDirection: 'row',
      backgroundColor: t.bgLayer,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    tabBtn: {
      flex: 1, paddingVertical: 12, alignItems: 'center',
      borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabBtnActive: { borderBottomColor: t.brandNavy },
    tabLbl: {
      fontSize: 12, color: t.textTertiary, fontWeight: '700',
    },
    tabLblActive: { color: t.brandNavy, fontWeight: '900' },

    card: {
      backgroundColor: t.bgLayer,
      borderRadius: 16, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10,
    },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
      gap: 4,
    },
    statusText: { fontSize: 12, fontWeight: '800' },
    date: { fontSize: 12, color: t.textTertiary, fontWeight: '600' },
    route: {
      flexDirection: 'row', alignItems: 'center',
      gap: 8, marginVertical: 3,
    },
    routeText: { flex: 1, fontSize: 14, color: t.textPrimary, fontWeight: '600' },
    amount: {
      fontSize: 16, fontWeight: '900',
      color: t.brandNavy, marginTop: 8, textAlign: 'right',
      letterSpacing: -0.3,
    },
    cardFooter: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'flex-end', marginTop: 8, gap: 2,
    },
    cardFooterText: { fontSize: 12, color: t.textTertiary, fontWeight: '600' },
  });
}
