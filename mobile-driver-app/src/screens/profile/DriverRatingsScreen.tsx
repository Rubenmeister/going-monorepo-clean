import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverStore } from '../../store/useDriverStore';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  passengerName?: string;
  createdAt: string;
}

interface RatingSummary {
  average: number;
  total: number;
  breakdown: Record<number, number>; // { 5: 120, 4: 30, ... }
}

const TAG_LABELS: Record<string, string> = {
  puntual: 'Puntual',
  amable: 'Amable',
  limpio: 'Vehículo limpio',
  seguro: 'Conducción segura',
  ruta: 'Buena ruta',
  musica: 'Buena música',
};

export function DriverRatingsScreen() {
  const { driver } = useDriverStore();
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, total: 0, breakdown: {} });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, ratingsRes] = await Promise.all([
        axios.get(`${API_BASE}/drivers/me/ratings/summary`, { headers }),
        axios.get(`${API_BASE}/drivers/me/ratings`, { headers }),
      ]);

      setSummary(summaryRes.data);
      setRatings(Array.isArray(ratingsRes.data) ? ratingsRes.data : ratingsRes.data?.ratings ?? []);
    } catch {
      // Usar rating del store como fallback
      setSummary({ average: driver?.rating ?? 5.0, total: 0, breakdown: {} });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= count ? 'star' : 'star-outline'}
          size={14}
          color={i <= count ? GOING_YELLOW : '#D1D5DB'}
        />
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: Rating }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Ionicons name="person" size={16} color={GOING_BLUE} />
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewerName}>{item.passengerName ?? 'Pasajero'}</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        {renderStars(item.rating)}
      </View>
      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{TAG_LABELS[tag] ?? tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOING_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.avgNumber}>{summary.average.toFixed(1)}</Text>
        {renderStars(Math.round(summary.average))}
        <Text style={styles.totalText}>{summary.total} calificaciones</Text>

        {/* Breakdown bars */}
        {[5, 4, 3, 2, 1].map(star => {
          const count = summary.breakdown[star] ?? 0;
          const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
          return (
            <View key={star} style={styles.breakdownRow}>
              <Text style={styles.breakdownStar}>{star}</Text>
              <Ionicons name="star" size={10} color={GOING_YELLOW} />
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.breakdownCount}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Reviews list */}
      {ratings.length > 0 ? (
        <FlatList
          data={ratings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Aún no tienes calificaciones</Text>
          <Text style={styles.emptyHint}>Completa viajes para recibir reseñas de tus pasajeros</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Summary
  summaryCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  avgNumber: { fontSize: 48, fontWeight: '900', color: GOING_BLUE },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  totalText: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 16 },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%', marginVertical: 2,
  },
  breakdownStar: { fontSize: 12, fontWeight: '700', color: '#374151', width: 14, textAlign: 'right' },
  barBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: GOING_YELLOW },
  breakdownCount: { fontSize: 11, color: '#6B7280', width: 28, textAlign: 'right' },

  // Reviews
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  reviewInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewComment: { fontSize: 13, color: '#374151', marginTop: 10, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
    backgroundColor: `${GOING_BLUE}08`,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: GOING_BLUE },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});
