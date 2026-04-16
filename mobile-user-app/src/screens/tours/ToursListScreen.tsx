import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchAPI } from '@services/api';

const GOING_BLUE   = '#0033A0';
const GOING_RED    = '#F04E40';
const GOING_YELLOW = '#F5C518';
const NAVY         = '#131b2e';
const GRAY         = '#6B7280';

interface Tour {
  id: string;
  title: string;
  description?: string;
  location: { city: string; country: string };
  price: { amount: number; currency: string };
  durationHours: number;
  category?: string;
  maxParticipants?: number;
  emoji?: string;
  badge?: string;
}

// ── Destinos Ecuador — datos demo ─────────────────────────────────────────────
const DEMO_TOURS: Tour[] = [
  {
    id: 'd1',
    title: 'Ruta del Tren Nariz del Diablo',
    description: 'Icónico descenso en tren por el zigzag más famoso de los Andes. Vista al cañón del río Chanchán.',
    location: { city: 'Alausí', country: 'Ecuador' },
    price: { amount: 45, currency: 'USD' },
    durationHours: 6,
    category: 'Aventura',
    maxParticipants: 20,
    emoji: '🚂',
    badge: 'Icónico',
  },
  {
    id: 'd2',
    title: 'Cotopaxi + Quilotoa Trek',
    description: 'Sube al volcán nevado más alto del mundo en actividad. Visita la laguna esmeralda de Quilotoa.',
    location: { city: 'Latacunga', country: 'Ecuador' },
    price: { amount: 65, currency: 'USD' },
    durationHours: 10,
    category: 'Montaña',
    maxParticipants: 12,
    emoji: '🏔️',
    badge: 'Popular',
  },
  {
    id: 'd3',
    title: 'Baños de Agua Santa Full Day',
    description: 'La ciudad del néctar: cascadas, tirolesa, swing at the end of the world y aguas termales.',
    location: { city: 'Baños', country: 'Ecuador' },
    price: { amount: 35, currency: 'USD' },
    durationHours: 8,
    category: 'Naturaleza',
    maxParticipants: 15,
    emoji: '🌊',
    badge: 'Favorito',
  },
  {
    id: 'd4',
    title: 'Otavalo & Laguna Cuicocha',
    description: 'Mercado artesanal más grande de América. Ruta a la caldera volcánica de Cuicocha y Cascada de Peguche.',
    location: { city: 'Otavalo', country: 'Ecuador' },
    price: { amount: 40, currency: 'USD' },
    durationHours: 9,
    category: 'Cultural',
    maxParticipants: 18,
    emoji: '🎨',
    badge: 'Cultural',
  },
  {
    id: 'd5',
    title: 'Papallacta Hot Springs & Cloud Forest',
    description: 'Termas naturales en los Andes a 3.300 m. Bosque nublado con aves exóticas y helechos gigantes.',
    location: { city: 'Papallacta', country: 'Ecuador' },
    price: { amount: 28, currency: 'USD' },
    durationHours: 5,
    category: 'Relax',
    maxParticipants: 25,
    emoji: '♨️',
    badge: 'Relajante',
  },
  {
    id: 'd6',
    title: 'Amazonia: Tena & Río Napo',
    description: 'Rafting en el Napo, caminata amazónica, comunidad kichwa y observación de loros.',
    location: { city: 'Tena', country: 'Ecuador' },
    price: { amount: 85, currency: 'USD' },
    durationHours: 2 * 24,
    category: 'Selva',
    maxParticipants: 10,
    emoji: '🌿',
    badge: 'Premium',
  },
];

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Icónico:   { bg: '#FEF3C7', text: '#92400E' },
  Popular:   { bg: '#FEF2F2', text: '#DC2626' },
  Favorito:  { bg: '#EFF6FF', text: '#1D4ED8' },
  Cultural:  { bg: '#F0FDF4', text: '#15803D' },
  Relajante: { bg: '#F0F9FF', text: '#0369A1' },
  Premium:   { bg: '#FAF5FF', text: '#7E22CE' },
};

export function ToursListScreen() {
  const [items, setItems]       = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity]         = useState('');

  useEffect(() => { fetchTours(); }, []);

  const fetchTours = async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.tours(
        cityFilter ? { city: cityFilter } : undefined
      );
      const apiItems: Tour[] = data || [];
      // Si la API devuelve datos, usarlos; si no, mostrar demo
      setItems(apiItems.length > 0 ? apiItems : DEMO_TOURS);
    } catch {
      // Fallback a demo con filtro local
      if (cityFilter) {
        const filtered = DEMO_TOURS.filter(t =>
          t.location.city.toLowerCase().includes(cityFilter.toLowerCase()) ||
          t.title.toLowerCase().includes(cityFilter.toLowerCase())
        );
        setItems(filtered.length > 0 ? filtered : DEMO_TOURS);
      } else {
        setItems(DEMO_TOURS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Tour }) => {
    const badgeStyle = item.badge ? (BADGE_COLORS[item.badge] ?? { bg: '#F3F4F6', text: '#374151' }) : null;
    const durationLabel = item.durationHours >= 24
      ? `${Math.round(item.durationHours / 24)} días`
      : `${item.durationHours}h`;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88}>
        {/* Color banner */}
        <View style={[styles.cardBanner, { backgroundColor: `${GOING_BLUE}12` }]}>
          <Text style={styles.cardEmoji}>{item.emoji ?? '🗺️'}</Text>
          {badgeStyle && item.badge && (
            <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{item.badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={13} color={GRAY} />
            <Text style={styles.locationText}>{item.location?.city}, Ecuador</Text>
          </View>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={GRAY} />
                <Text style={styles.metaText}>{durationLabel}</Text>
              </View>
              {item.maxParticipants && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color={GRAY} />
                  <Text style={styles.metaText}>Máx. {item.maxParticipants}</Text>
                </View>
              )}
              {item.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>${item.price?.amount}<Text style={styles.priceUnit}>/persona</Text></Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Destinos & Tours</Text>
        <Text style={styles.heroSub}>Descubre lo mejor del Ecuador 🇪🇨</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o destino..."
          placeholderTextColor="#9CA3AF"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => fetchTours(city)}
          returnKeyType="search"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => { setCity(''); fetchTours(); }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_BLUE} />
          <Text style={styles.loadingText}>Cargando tours...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay tours disponibles</Text>
          <TouchableOpacity onPress={() => fetchTours()}>
            <Text style={styles.retryText}>Ver todos los destinos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Hero
  hero: {
    backgroundColor: GOING_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },

  // State
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  emptyText:   { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  retryText:   { fontSize: 13, color: GOING_BLUE, fontWeight: '700', marginTop: 4 },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardBanner: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  cardEmoji: { fontSize: 40 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },

  cardBody: { padding: 14, paddingTop: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 4, lineHeight: 20 },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  locationText:  { fontSize: 12, color: GRAY },
  cardDesc: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 12, color: GRAY },
  categoryTag: {
    backgroundColor: `${GOING_BLUE}10`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  categoryText: { fontSize: 10, fontWeight: '700', color: GOING_BLUE },
  price:     { fontSize: 18, fontWeight: '900', color: GOING_BLUE },
  priceUnit: { fontSize: 11, fontWeight: '600', color: GRAY },
});
