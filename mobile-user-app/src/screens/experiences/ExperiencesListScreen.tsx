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

interface Experience {
  id: string;
  title: string;
  description?: string;
  location: { city: string; country: string };
  price: { amount: number; currency: string };
  durationHours?: number;
  category?: string;
  hostId?: string;
}

export function ExperiencesListScreen() {
  const [items, setItems] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city, setCity] = useState('');

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.experiences(
        cityFilter ? { city: cityFilter } : undefined
      );
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Experience }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBadge}>
          <Ionicons name="star-outline" size={22} color={GOING_BLUE} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardLocation}>
            {item.location?.city}, {item.location?.country}
          </Text>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        {item.durationHours && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}> {item.durationHours}h</Text>
          </View>
        )}
        {item.category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        <Text style={styles.price}>${item.price?.amount}/persona</Text>
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
          onSubmitEditing={() => fetchExperiences(city)}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => fetchExperiences(city)}>
          <Ionicons name="search" size={20} color={GOING_BLUE} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_BLUE} />
          <Text style={styles.loadingText}>Cargando experiencias...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay experiencias disponibles</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
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
  cardDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6B7280' },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { fontSize: 11, color: GOING_BLUE, fontWeight: '600' },
  price: {
    marginLeft: 'auto',
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
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
