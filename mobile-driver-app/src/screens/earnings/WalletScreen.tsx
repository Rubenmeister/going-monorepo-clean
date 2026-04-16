/**
 * WalletScreen — Ingresos y pagos del conductor
 *
 * Secciones:
 *  - Balance disponible + botón Retirar
 *  - Resumen por método de pago (tarjeta / efectivo / wallet)
 *  - Tabs: Todos / Digitales / Efectivo
 *  - Historial de transacciones (paginado, carga más con scroll)
 *
 * API:
 *  GET  /drivers/me/wallet           — balance disponible
 *  GET  /drivers/me/earnings?period= — resumen semanal
 *  GET  /drivers/me/earnings/history — historial paginado
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

// ─── Brand ───────────────────────────────────────────────────────────────────
const NAVY   = '#0033A0';
const YELLOW = '#FFCD00';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Tab = 'ingresos' | 'pagos' | 'efectivo';

type Transaction = {
  paymentId: string;
  tripId:    string;
  amount:    number;      // neto del conductor
  grossAmount: number;
  paymentMethod: 'cash' | 'card' | 'wallet' | string;
  completedAt: string;
};

type WalletSummary = {
  availableBalance:   number;
  pendingWithdrawals: number;
  totalBalance:       number;
  currency:           string;
};

type EarningsSummary = {
  totalEarnings:   number;
  totalTrips:      number;
  byPaymentMethod: { card: number; cash: number; wallet: number };
  averagePerTrip:  number;
};

// ─── Helpers API ─────────────────────────────────────────────────────────────
async function authHeaders() {
  const token = await AsyncStorage.getItem('driver_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─────────────────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<DriverMainStackParamList>;

const PAGE_SIZE = 20;

export function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab,  setActiveTab]  = useState<Tab>('ingresos');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [wallet,    setWallet]    = useState<WalletSummary | null>(null);
  const [earnings,  setEarnings]  = useState<EarningsSummary | null>(null);
  const [history,   setHistory]   = useState<Transaction[]>([]);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);

  // ── Carga datos ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      const headers = await authHeaders();

      const [walletRes, earningsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/drivers/me/wallet`,            { headers }),
        axios.get(`${API_BASE_URL}/drivers/me/earnings?period=week`, { headers }),
        axios.get(`${API_BASE_URL}/drivers/me/earnings/history?limit=${PAGE_SIZE}&page=1`, { headers }),
      ]);

      setWallet(walletRes.data);
      setEarnings(earningsRes.data.summary);

      const data: Transaction[] = historyRes.data.data ?? [];
      setHistory(data);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        console.warn('WalletScreen fetch error:', err?.message);
      }
      // Si falla, dejamos los datos anteriores (o vacíos en primera carga)
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const headers = await authHeaders();
      const nextPage = page + 1;
      const res = await axios.get(
        `${API_BASE_URL}/drivers/me/earnings/history?limit=${PAGE_SIZE}&page=${nextPage}`,
        { headers },
      );
      const newItems: Transaction[] = res.data.data ?? [];
      setHistory(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(newItems.length === PAGE_SIZE);
    } catch {
      // silencioso
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  // ── Filtro de transacciones por tab ─────────────────────────────────────────
  const filteredHistory = () => {
    switch (activeTab) {
      case 'pagos':
        return history.filter(t => t.paymentMethod === 'card' || t.paymentMethod === 'wallet');
      case 'efectivo':
        return history.filter(t => t.paymentMethod === 'cash');
      default:
        return history;
    }
  };

  // ── Colores / iconos ─────────────────────────────────────────────────────────
  const methodIcon = (m: string): React.ComponentProps<typeof Ionicons>['name'] => {
    if (m === 'cash')   return 'cash-outline';
    if (m === 'wallet') return 'wallet-outline';
    return 'card-outline';
  };
  const methodColor = (m: string) =>
    m === 'cash' ? '#059669' : m === 'wallet' ? '#7C3AED' : '#1E3A8A';
  const methodBg = (m: string) =>
    m === 'cash' ? '#F0FDF4' : m === 'wallet' ? '#F5F3FF' : '#EFF6FF';

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) +
             ' · ' +
             d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  // ── Estados vacíos / loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  const balance   = wallet?.availableBalance ?? 0;
  const pending   = wallet?.pendingWithdrawals ?? 0;
  const cardAmt   = earnings?.byPaymentMethod?.card   ?? 0;
  const cashAmt   = earnings?.byPaymentMethod?.cash   ?? 0;
  const walletAmt = earnings?.byPaymentMethod?.wallet ?? 0;
  const cashCount = history.filter(t => t.paymentMethod === 'cash').length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const near = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
          if (near) loadMore();
        }}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
        }
      >
        {/* ── Header + Balance ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSub}>Esta semana</Text>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Balance disponible</Text>
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            <Text style={styles.balanceCurrency}>USD</Text>

            {pending > 0 && (
              <Text style={styles.pendingText}>
                ${pending.toFixed(2)} en proceso de retiro
              </Text>
            )}

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('Withdraw', {
                availableBalance: balance,
                currency: 'USD',
              })}
            >
              <Ionicons name="arrow-up-circle" size={18} color={NAVY} />
              <Text style={styles.withdrawBtnText}>Retirar fondos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Resumen por método ────────────────────────────────────────────── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#1E3A8A' }]}>
            <Ionicons name="card-outline" size={18} color="#1E3A8A" />
            <Text style={styles.summaryAmount}>${cardAmt.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Tarjeta</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#059669' }]}>
            <Ionicons name="cash-outline" size={18} color="#059669" />
            <Text style={styles.summaryAmount}>${cashAmt.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Efectivo</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#7C3AED' }]}>
            <Ionicons name="wallet-outline" size={18} color="#7C3AED" />
            <Text style={styles.summaryAmount}>${walletAmt.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Wallet</Text>
          </View>
        </View>

        {/* ── Consolidado efectivo ─────────────────────────────────────────── */}
        {activeTab === 'efectivo' && (
          <View style={styles.cashConsolidated}>
            <View style={styles.cashConsolidatedHeader}>
              <Ionicons name="cash" size={18} color="#059669" />
              <Text style={styles.cashConsolidatedTitle}>Consolidado en efectivo</Text>
            </View>
            <Text style={styles.cashConsolidatedSub}>
              Pagos en efectivo recibidos de los pasajeros. No aparecen en tu balance digital.
            </Text>
            <View style={styles.cashRow}>
              <Text style={styles.cashRowLabel}>Total cobrado</Text>
              <Text style={styles.cashRowValue}>${cashAmt.toFixed(2)}</Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashRowLabel}>N° de viajes</Text>
              <Text style={styles.cashRowValue}>{cashCount}</Text>
            </View>
            <View style={[styles.cashRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.cashRowLabel}>Promedio por viaje</Text>
              <Text style={styles.cashRowValue}>
                ${(cashAmt / Math.max(1, cashCount)).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          {([
            ['ingresos', 'Todos'],
            ['pagos',    'Digitales'],
            ['efectivo', 'Efectivo'],
          ] as [Tab, string][]).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Historial ────────────────────────────────────────────────────── */}
        <View style={styles.txList}>
          {filteredHistory().length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Sin transacciones</Text>
            </View>
          ) : (
            filteredHistory().map(tx => (
              <View key={tx.paymentId} style={styles.txRow}>
                <View style={[styles.txIconBg, { backgroundColor: methodBg(tx.paymentMethod) }]}>
                  <Ionicons
                    name={methodIcon(tx.paymentMethod)}
                    size={18}
                    color={methodColor(tx.paymentMethod)}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    Viaje · {tx.tripId?.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(tx.completedAt)}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>+${tx.amount.toFixed(2)}</Text>
                  <Text style={styles.txMethodLabel}>
                    {tx.paymentMethod === 'cash' ? 'Efectivo'
                      : tx.paymentMethod === 'wallet' ? 'Wallet'
                      : 'Tarjeta'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {loadingMore && (
            <ActivityIndicator size="small" color={NAVY} style={{ marginVertical: 12 }} />
          )}

          {!hasMore && history.length > 0 && (
            <Text style={styles.endText}>· Fin del historial ·</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // Balance card
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  balanceLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  balanceAmount:  { color: '#fff', fontSize: 38, fontWeight: '900' },
  balanceCurrency:{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 },
  pendingText:    { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 10 },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  withdrawBtnText: { color: NAVY, fontWeight: '900', fontSize: 14 },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryAmount: { fontSize: 14, fontWeight: '900', color: '#111827' },
  summaryLabel:  { fontSize: 9, color: '#6B7280', fontWeight: '600' },

  // Cash consolidated
  cashConsolidated: {
    margin: 16,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cashConsolidatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cashConsolidatedTitle: { fontSize: 13, fontWeight: '800', color: '#065F46' },
  cashConsolidatedSub:   { fontSize: 11, color: '#047857', lineHeight: 16, marginBottom: 12 },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  cashRowLabel: { fontSize: 12, color: '#065F46' },
  cashRowValue: { fontSize: 13, fontWeight: '800', color: '#059669' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  tab:         { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabActive:   { backgroundColor: NAVY },
  tabText:     { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: YELLOW },

  // Transaction list
  txList:  { padding: 16, paddingTop: 8 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txInfo:        { flex: 1 },
  txDesc:        { fontSize: 12, fontWeight: '600', color: '#111827' },
  txDate:        { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  txRight:       { alignItems: 'flex-end' },
  txAmount:      { fontSize: 13, fontWeight: '900', color: '#059669' },
  txMethodLabel: { fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: 2 },

  empty:     { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  endText:   { textAlign: 'center', color: '#D1D5DB', fontSize: 11, marginVertical: 16 },
});
