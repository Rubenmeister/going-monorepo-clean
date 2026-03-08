import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchAPI } from '@services/api';

interface Result {
  id: string;
  name: string;
  type: 'transport' | 'accommodation' | 'tour' | 'experience';
  description?: string;
  price?: number;
}

const TYPE_LABELS: Record<string, string> = {
  transport: 'Transporte',
  accommodation: 'Hospedaje',
  tour: 'Tour',
  experience: 'Experiencia',
};

const TYPE_ICONS: Record<string, string> = {
  transport: 'car-outline',
  accommodation: 'bed-outline',
  tour: 'map-outline',
  experience: 'star-outline',
};

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const { data } = await searchAPI.search(query);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Result }) => (
    <TouchableOpacity style={styles.resultCard}>
      <View style={styles.iconBadge}>
        <Ionicons
          name={TYPE_ICONS[item.type] as any}
          size={22}
          color="#0033A0"
        />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultType}>{TYPE_LABELS[item.type]}</Text>
        {item.description && (
          <Text style={styles.resultDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      {item.price && <Text style={styles.resultPrice}>${item.price}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Buscar transportes, tours, hospedaje..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
              setSearched(false);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0033A0" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      {!isLoading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
        </View>
      )}

      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!searched && (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={64} color="#D1D5DB" />
          <Text style={styles.hintText}>
            Escribe para buscar servicios Going
          </Text>
        </View>
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
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultType: {
    fontSize: 12,
    color: '#0033A0',
    fontWeight: '600',
    marginTop: 2,
  },
  resultDesc: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  resultPrice: { fontSize: 15, fontWeight: '800', color: '#059669' },
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
  hintText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
