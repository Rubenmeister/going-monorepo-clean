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

const GOING_RED  = '#F04E40';
const GOING_BLUE = '#0033A0';
const NAVY       = '#131b2e';
const GRAY       = '#6B7280';

interface Experience {
  id: string;
  title: string;
  description?: string;
  location: { city: string; country: string };
  price: { amount: number; currency: string };
  durationHours?: number;
  category?: string;
  hostId?: string;
  emoji?: string;
  hostName?: string;
}

// ── Experiencias demo — Ecuador ───────────────────────────────────────────────
const DEMO_EXPERIENCES: Experience[] = [
  {
    id: 'e1',
    title: 'Cocina ecuatoriana con abuela serrana',
    description: 'Aprende a cocinar hornado, llapingachos y mote en la cocina de una familia ambateña. Incluye almuerzo.',
    location: { city: 'Ambato', country: 'Ecuador' },
    price: { amount: 25, currency: 'USD' },
    durationHours: 4,
    category: 'Gastronomía',
    emoji: '🍲',
    hostName: 'Mama Rosa',
  },
  {
    id: 'e2',
    title: 'Telar ancestral kichwa en Otavalo',
    description: 'Artesano kichwa te enseña la técnica milenaria del telar de cintura. Te llevas tu tejido creado.',
    location: { city: 'Otavalo', country: 'Ecuador' },
    price: { amount: 30, currency: 'USD' },
    durationHours: 3,
    category: 'Artesanía',
    emoji: '🧶',
    hostName: 'Tupac Quispe',
  },
  {
    id: 'e3',
    title: 'Ciclismo volcánico: descenso del Chimborazo',
    description: 'Descenso en mountain bike desde 4.800m. Vistas épicas, paja de páramo y vicuñas en libertad.',
    location: { city: 'Riobamba', country: 'Ecuador' },
    price: { amount: 55, currency: 'USD' },
    durationHours: 5,
    category: 'Aventura',
    emoji: '🚵',
    hostName: 'Andes Bike Ecuador',
  },
  {
    id: 'e4',
    title: 'Fotografía urbana en el Centro Histórico de Quito',
    description: 'Paseo fotográfico por el centro UNESCO. Iglesias barrocas, miradores y vida cotidiana quiteña.',
    location: { city: 'Quito', country: 'Ecuador' },
    price: { amount: 20, currency: 'USD' },
    durationHours: 3,
    category: 'Fotografía',
    emoji: '📸',
    hostName: 'Diego Arcos',
  },
  {
    id: 'e5',
    title: 'Surf & yoga en Montañita',
    description: 'Clase de surf al amanecer + sesión de yoga frente al Pacífico. Para principiantes y avanzados.',
    location: { city: 'Montañita', country: 'Ecuador' },
    price: { amount: 40, currency: 'USD' },
    durationHours: 4,
    category: 'Bienestar',
    emoji: '🏄',
    hostName: 'Pacific Soul',
  },
  {
    id: 'e6',
    title: 'Avistamiento de ballenas jorobadas',
    description: 'Temporada julio-octubre. Tour en lancha a las islas de la Plata. Con guía naturalista certificado.',
    location: { city: 'Puerto López', country: 'Ecuador' },
    price: { amount: 50, currency: 'USD' },
    durationHours: 6,
    category: 'Naturaleza',
    emoji: '🐋',
    hostName: 'Machalilla Tours',
  },
];

export function ExperiencesListScreen() {
  const [items, setItems]         = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity]           = useState('');

  useEffect(() => { fetchExperiences(); }, []);

  const fetchExperiences = async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.experiences(
        cityFilter ? { city: cityFilter } : undefined
      );
      const apiItems: Experience[] = data || [];
      setItems(apiItems.length > 0 ? apiItems : DEMO_EXPERIENCES);
    } catch {
      if (cityFilter) {
        const filtered = DEMO_EXPERIENCES.filter(e =>
          e.location.city.toLowerCase().includes(cityFilter.toLowerCase()) ||
          e.title.toLowerCase().includes(cityFilter.toLowerCase())
        );
        setItems(filtered.length > 0 ? filtered : DEMO_EXPERIENCES);
      } else {
        setItems(DEMO_EXPERIENCES);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Experience }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.88}>
      {/* Banner */}
      <View style={styles.cardBanner}>
        <Text style={styles.cardEmoji}>{item.emoji ?? '⭐'}</Text>
        {item.category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={GRAY} />
          <Text style={styles.locationText}>{item.location?.city}, Ecuador</Text>
          {item.hostName && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.hostText}>con {item.hostName}</Text>
            </>
          )}
        </View>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            {item.durationHours && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={GRAY} />
                <Text style={styles.metaText}>{item.durationHours}h</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={12} color={GOING_RED} />
              <Text style={[styles.metaText, { color: GOING_RED }]}>Por persona</Text>
            </View>
          </View>
          <Text style={styles.price}>${item.price?.amount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Experiencias</Text>
        <Text style={styles.heroSub}>Vive el Ecuador como local ✨</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o tipo de experiencia..."
          placeholderTextColor="#9CA3AF"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => fetchExperiences(city)}
          returnKeyType="search"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => { setCity(''); fetchExperiences(); }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_RED} />
          <Text style={styles.loadingText}>Cargando experiencias...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay experiencias disponibles</Text>
          <TouchableOpacity onPress={() => fetchExperiences()}>
            <Text style={styles.retryText}>Ver todas las experiencias</Text>
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
    backgroundColor: GOING_RED,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

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

  // States
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  emptyText:   { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  retryText:   { fontSize: 13, color: GOING_RED, fontWeight: '700', marginTop: 4 },

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
    height: 72,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 36 },
  categoryTag: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: `${GOING_RED}18`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: { fontSize: 10, fontWeight: '800', color: GOING_RED },

  cardBody:  { padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 4, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6, flexWrap: 'wrap' },
  locationText: { fontSize: 12, color: GRAY },
  dot:  { fontSize: 12, color: '#D1D5DB', marginHorizontal: 2 },
  hostText: { fontSize: 12, color: GOING_BLUE, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow:    { flexDirection: 'row', gap: 10 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 12, color: GRAY },
  price:      { fontSize: 18, fontWeight: '900', color: GOING_RED },
});
