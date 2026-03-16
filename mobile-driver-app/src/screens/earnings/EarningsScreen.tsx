import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { hapticMedium, hapticSuccess } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { exportEarningsPDF } from '../../utils/earningsReport';
import { analyticsEarningsReportExported } from '../../utils/analytics';

type Nav = NativeStackNavigationProp<DriverMainStackParamList>;

interface DaySummary {
  date: string;
  trips: number;
  earnings: number;
}

export function EarningsScreen() {
  const navigation = useNavigation<Nav>();
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    total: 0,
    trips: 0,
  });
  const [history, setHistory] = useState<DaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const { data } = await axios.get(
        `${
          process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/payment/driver/earnings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(
        data.summary || { today: 47.5, week: 215.3, total: 3420.8, trips: 6 }
      );
      setHistory(data.history || []);
    } catch {
      // Use demo data if API is unavailable
      setSummary({ today: 47.5, week: 215.3, total: 3420.8, trips: 6 });
      setHistory([
        { date: '2026-03-09', trips: 6,  earnings: 47.5 },
        { date: '2026-03-08', trips: 9,  earnings: 63.0 },
        { date: '2026-03-07', trips: 8,  earnings: 56.4 },
        { date: '2026-03-06', trips: 7,  earnings: 49.8 },
        { date: '2026-03-05', trips: 5,  earnings: 37.2 },
        { date: '2026-03-04', trips: 11, earnings: 78.1 },
        { date: '2026-03-03', trips: 4,  earnings: 28.6 },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Memoized chart data — recalculates only when history changes
  const chartDays = useMemo(() => {
    if (history.length === 0) return null;
    const days = [...history].reverse();
    const maxEarning = Math.max(...days.map(d => d.earnings), 1);
    return { days, maxEarning };
  }, [history]);

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    hapticMedium();
    try {
      const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const days = history.map(d => {
        const dt = new Date(d.date);
        return {
          label:    DAYS[dt.getDay()],
          date:     dt.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }),
          earnings: d.earnings,
          trips:    d.trips,
        };
      });
      const oldest = history.length > 0 ? new Date(history[history.length - 1].date) : new Date();
      const newest = history.length > 0 ? new Date(history[0].date) : new Date();
      const fmt = (dt: Date) => dt.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
      const period = `${fmt(oldest)} – ${fmt(newest)}`;

      await exportEarningsPDF({
        driverName:    'Conductor Going',
        vehicleType:   'SUV',
        period,
        totalEarnings: summary.total,
        totalTrips:    summary.trips,
        avgRating:     4.9,
        days,
      });
      hapticSuccess();
      analyticsEarningsReportExported('pdf');
    } catch (e) {
      console.warn('[EarningsScreen] PDF export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0033A0" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#0033A0"
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total acumulado</Text>
        <Text style={styles.heroValue}>${summary.total.toFixed(2)}</Text>
        <Text style={styles.heroSub}>{summary.trips} viajes en total</Text>
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() =>
            hapticMedium(); navigation.navigate('Withdraw', {
              availableBalance: summary.total,
              currency: 'USD',
            })
          }
        >
          <Text style={styles.withdrawBtnText}>💸 Retirar ganancias</Text>
        </TouchableOpacity>
      </View>

      {/* ── Gráfico de ganancias 7 días ── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Últimos 7 días</Text>
          <Text style={styles.chartTotal}>
            ${history.reduce((s, d) => s + d.earnings, 0).toFixed(2)}
          </Text>
        </View>
        {chartDays && (
          <View style={styles.barsRow}>
            {chartDays.days.map((day, i) => {
              const pct = day.earnings / chartDays.maxEarning;
              const isToday = i === chartDays.days.length - 1;
              const dayLabel = new Date(day.date).toLocaleDateString('es', { weekday: 'short' });
              return (
                <View key={day.date} style={styles.barCol}>
                  <Text style={styles.barValue}>${day.earnings.toFixed(0)}</Text>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      {
                        height: `${Math.max(pct * 100, 8)}%`,
                        backgroundColor: isToday ? '#FFCD00' : '#0033A0',
                        opacity: isToday ? 1 : 0.5 + pct * 0.5,
                      },
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFCD00' }]} />
            <Text style={styles.legendText}>Hoy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0033A0' }]} />
            <Text style={styles.legendText}>Días anteriores</Text>
          </View>
        </View>
      </View>

      {/* Exportar PDF */}
      <TouchableOpacity
        style={[styles.exportBtn, isExporting && styles.exportBtnLoading]}
        onPress={handleExportPDF}
        activeOpacity={0.8}
        disabled={isExporting}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="document-text-outline" size={18} color="#fff" />
        )}
        <Text style={styles.exportBtnText}>
          {isExporting ? 'Generando PDF…' : 'Exportar reporte PDF'}
        </Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        {[
          {
            label: 'Hoy',
            value: `$${summary.today.toFixed(2)}`,
            icon: '📅',
            color: '#10B981',
          },
          {
            label: 'Esta semana',
            value: `$${summary.week.toFixed(2)}`,
            icon: '🚗',
            color: '#0033A0',
          },
        ].map(({ label, value, icon, color }) => (
          <View key={label} style={styles.statCard}>
            <Text style={[styles.statIcon, { color }]}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Ver historial completo */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('TripHistory')}
        activeOpacity={0.8}
      >
        <Text style={styles.historyBtnText}>Ver historial completo de viajes</Text>
        <Ionicons name="chevron-forward" size={16} color="#0033A0" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Resumen reciente</Text>
      {history.length === 0 && (
        <Text style={styles.emptyText}>Sin registros disponibles</Text>
      )}
      {history.map((day) => (
        <View key={day.date} style={styles.historyRow}>
          <View>
            <Text style={styles.historyDate}>
              {new Date(day.date).toLocaleDateString('es-EC', {
                weekday: 'long',
                day: '2-digit',
                month: 'short',
              })}
            </Text>
            <Text style={styles.historyTrips}>{day.trips} viajes</Text>
          </View>
          <Text style={styles.historyEarnings}>${day.earnings.toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: '#0033A0',
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 20,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  heroValue: {
    color: '#FFCD00',
    fontSize: 40,
    fontWeight: '900',
    marginVertical: 4,
  },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  statIcon: { fontSize: 24, marginBottom: 4 },
  withdrawBtn: {
    marginTop: 14,
    backgroundColor: '#FFCD00',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  withdrawBtnText: { color: '#0033A0', fontWeight: '800', fontSize: 14 },
  // Chart
  chartCard: {
    backgroundColor: '#fff', borderRadius: 20, margin: 16, marginBottom: 8,
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  chartTotal: { fontSize: 18, fontWeight: '900', color: '#0033A0' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: 8 },
  barCol:  { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 8, fontWeight: '700', color: '#6B7280', marginBottom: 3 },
  barTrack: { width: '100%', height: '80%', justifyContent: 'flex-end' },
  barFill:  { width: '100%', borderRadius: 4, minHeight: 6 },
  barLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  barLabelToday: { color: '#0033A0', fontWeight: '800' },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  historyBtnText: { color: '#0033A0', fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  historyTrips: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyEarnings: { fontSize: 17, fontWeight: '900', color: '#059669' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 20 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff4c41',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  exportBtnLoading: { opacity: 0.7 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
