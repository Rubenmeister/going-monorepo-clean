import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';

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
        { date: '2026-03-07', trips: 8, earnings: 56.4 },
        { date: '2026-03-06', trips: 7, earnings: 49.8 },
        { date: '2026-03-05', trips: 5, earnings: 37.2 },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
            navigation.navigate('Withdraw', {
              availableBalance: summary.total,
              currency: 'USD',
            })
          }
        >
          <Text style={styles.withdrawBtnText}>💸 Retirar ganancias</Text>
        </TouchableOpacity>
      </View>

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
});
