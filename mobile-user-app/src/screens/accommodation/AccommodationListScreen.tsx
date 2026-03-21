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

const GOING_BLUE = '#0033A0';

interface Accommodation {
  id: string;
  title: string;
  location: { city: string; country: string };
  pricePerNight: { amount: number; currency: string };
  capacity: number;
  amenities: string[];
  status: string;
}

export function AccommodationListScreen() {
  const [items, setItems] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.accommodations(
        cityFilter ? { city: cityFilter } : undefined
      );
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  };

  const renderItem = ({ item }: { item: Accommodation }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBadge}>
          <Ionicons name="bed-outline" size={22} color={GOING_BLUE} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardLocation}>
            {item.location?.city}, {item.location?.country}
          </Text>
        </View>
        <Text style={styles.cardPrice}>
          ${item.pricePerNight?.amount}
          <Text style={styles.perNight}>/noche</Text>
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Ionicons name="people-outline" size={14} color="#6B7280" />
        <Text style={styles.capacity}> {item.capacity} huéspedes</Text>
        {item.amenities?.slice(0, 3).map((a, i) => (
          <View key={i} style={styles.amenityTag}>
            <Text style={styles.amenityText}>{a}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="location-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o destino..."
          placeholderTextColor="#9CA3AF"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => fetchAccommodations(city)}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => fetchAccommodations(city)}>
          <Ionicons name="search" size={20} color={GOING_BLUE} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_BLUE} />
          <Text style={styles.loadingText}>Buscando alojamientos...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bed-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {searched ? 'No hay alojamientos disponibles' : 'Busca un destino'}
          </Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  input: { flex: 1, fontSize: 15, color: '#111827', marginHorizontal: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#059669' },
  perNight: { fontSize: 11, fontWeight: '400', color: '#6B7280' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  capacity: { fontSize: 12, color: '#6B7280', marginRight: 8 },
  amenityTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  amenityText: { fontSize: 11, color: '#374151' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
});
