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
const GOING_GREEN  = '#059669';
const NAVY         = '#131b2e';
const GRAY         = '#6B7280';

interface Accommodation {
  id: string;
  title: string;
  location: { city: string; country: string };
  pricePerNight: { amount: number; currency: string };
  capacity: number;
  amenities: string[];
  status?: string;
  emoji?: string;
  rating?: number;
  type?: string;
}

// ── Alojamientos demo — Ecuador ───────────────────────────────────────────────
const DEMO_ACCOMMODATIONS: Accommodation[] = [
  {
    id: 'a1',
    title: 'Casa Hacienda San Agustín del Callo',
    location: { city: 'Latacunga', country: 'Ecuador' },
    pricePerNight: { amount: 120, currency: 'USD' },
    capacity: 4,
    amenities: ['WiFi', 'Desayuno', 'Caballos', 'Jacuzzi'],
    emoji: '🏛️',
    rating: 4.9,
    type: 'Hacienda',
  },
  {
    id: 'a2',
    title: 'Hostal Casa Gangotena — Centro Histórico',
    location: { city: 'Quito', country: 'Ecuador' },
    pricePerNight: { amount: 95, currency: 'USD' },
    capacity: 2,
    amenities: ['WiFi', 'Piscina', 'Spa', 'Restaurante'],
    emoji: '🏨',
    rating: 4.8,
    type: 'Hotel boutique',
  },
  {
    id: 'a3',
    title: 'Glamping Volcánico frente al Cotopaxi',
    location: { city: 'Machachi', country: 'Ecuador' },
    pricePerNight: { amount: 75, currency: 'USD' },
    capacity: 2,
    amenities: ['Chimenea', 'Telescopio', 'Desayuno', 'Estacionamiento'],
    emoji: '⛺',
    rating: 5.0,
    type: 'Glamping',
  },
  {
    id: 'a4',
    title: 'Cabaña en el Bosque Nublado de Mindo',
    location: { city: 'Mindo', country: 'Ecuador' },
    pricePerNight: { amount: 45, currency: 'USD' },
    capacity: 3,
    amenities: ['WiFi', 'Desayuno', 'Kayak', 'Tubing'],
    emoji: '🌿',
    rating: 4.7,
    type: 'Cabaña',
  },
  {
    id: 'a5',
    title: 'Suite en Lodge Amazónico del Napo',
    location: { city: 'Tena', country: 'Ecuador' },
    pricePerNight: { amount: 85, currency: 'USD' },
    capacity: 2,
    amenities: ['Selva', 'Guía', 'Canoa', 'Wifi satelital'],
    emoji: '🌴',
    rating: 4.9,
    type: 'Lodge',
  },
  {
    id: 'a6',
    title: 'Apartamento frente al Mar en Salinas',
    location: { city: 'Salinas', country: 'Ecuador' },
    pricePerNight: { amount: 60, currency: 'USD' },
    capacity: 5,
    amenities: ['WiFi', 'AC', 'Playa', 'Cocina'],
    emoji: '🌊',
    rating: 4.6,
    type: 'Apartamento',
  },
];

export function AccommodationListScreen() {
  const [items, setItems]         = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity]           = useState('');

  useEffect(() => { fetchAccommodations(); }, []);

  const fetchAccommodations = async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.accommodations(
        cityFilter ? { city: cityFilter } : undefined
      );
      const apiItems: Accommodation[] = data || [];
      setItems(apiItems.length > 0 ? apiItems : DEMO_ACCOMMODATIONS);
    } catch {
      if (cityFilter) {
        const filtered = DEMO_ACCOMMODATIONS.filter(a =>
          a.location.city.toLowerCase().includes(cityFilter.toLowerCase()) ||
          a.title.toLowerCase().includes(cityFilter.toLowerCase())
        );
        setItems(filtered.length > 0 ? filtered : DEMO_ACCOMMODATIONS);
      } else {
        setItems(DEMO_ACCOMMODATIONS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const renderItem = ({ item }: { item: Accommodation }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.88}>
      {/* Banner */}
      <View style={styles.cardBanner}>
        <Text style={styles.cardEmoji}>{item.emoji ?? '🏠'}</Text>
        {item.type && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>${item.pricePerNight?.amount}<Text style={styles.perNight}>/noche</Text></Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={GRAY} />
          <Text style={styles.locationText}>{item.location?.city}, Ecuador</Text>
          {item.rating && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)} ★</Text>
            </>
          )}
        </View>

        <View style={styles.amenitiesRow}>
          <Ionicons name="people-outline" size={13} color={GRAY} />
          <Text style={styles.capacityText}>{item.capacity} huéspedes</Text>
          {item.amenities?.slice(0, 3).map((a, i) => (
            <View key={i} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{a}</Text>
            </View>
          ))}
          {(item.amenities?.length ?? 0) > 3 && (
            <Text style={styles.moreAmenities}>+{(item.amenities?.length ?? 0) - 3} más</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Alojamiento</Text>
        <Text style={styles.heroSub}>Hospedaje curado en todo Ecuador 🏡</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o tipo de alojamiento..."
          placeholderTextColor="#9CA3AF"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => fetchAccommodations(city)}
          returnKeyType="search"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => { setCity(''); fetchAccommodations(); }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_BLUE} />
          <Text style={styles.loadingText}>Buscando alojamientos...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bed-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay alojamientos disponibles</Text>
          <TouchableOpacity onPress={() => fetchAccommodations()}>
            <Text style={styles.retryText}>Ver todos los alojamientos</Text>
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
    backgroundColor: GOING_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

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
    height: 72,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 36 },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: `${GOING_GREEN}20`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: { fontSize: 10, fontWeight: '800', color: GOING_GREEN },

  cardBody:   { padding: 14 },
  titleRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle:  { flex: 1, fontSize: 14, fontWeight: '800', color: NAVY, lineHeight: 20 },
  price:      { fontSize: 17, fontWeight: '900', color: GOING_GREEN },
  perNight:   { fontSize: 10, fontWeight: '500', color: GRAY },

  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  locationText: { fontSize: 12, color: GRAY },
  dot:          { fontSize: 12, color: '#D1D5DB', marginHorizontal: 2 },
  ratingText:   { fontSize: 12, color: '#F59E0B', fontWeight: '700' },

  amenitiesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  capacityText: { fontSize: 12, color: GRAY },
  amenityTag:   {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  amenityText:   { fontSize: 11, color: '#374151', fontWeight: '500' },
  moreAmenities: { fontSize: 11, color: GOING_BLUE, fontWeight: '600' },
});
