import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/apiClient';

type Category = 'tours' | 'experiences' | 'accommodations';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('tours');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const CATEGORIES: { key: Category; label: string; icon: string }[] = [
    { key: 'tours', label: 'Tours', icon: 'map' },
    { key: 'experiences', label: 'Experiencias', icon: 'ticket' },
    { key: 'accommodations', label: 'Alojamiento', icon: 'bed' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      let data: any[] = [];
      if (category === 'tours') data = await apiClient.searchTours(query);
      else if (category === 'experiences')
        data = await apiClient.searchExperiences(query);
      else data = await apiClient.searchAccommodations(query);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar destino, ciudad..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <View style={styles.tabs}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.tab, category === c.key && styles.tabActive]}
            onPress={() => {
              setCategory(c.key);
              setResults([]);
              setSearched(false);
            }}
          >
            <Ionicons
              name={c.icon as any}
              size={16}
              color={category === c.key ? '#0033A0' : '#999'}
            />
            <Text
              style={[
                styles.tabLabel,
                category === c.key && styles.tabLabelActive,
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#0033A0"
          style={{ marginTop: 40 }}
        />
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
        </View>
      )}

      {results.map((item, i) => (
        <View key={item.id ?? i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title || item.name}</Text>
            {item.price && (
              <Text style={styles.cardPrice}>
                ${item.price?.amount ?? item.price}
              </Text>
            )}
          </View>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.location && (
            <Text style={styles.cardLocation}>
              📍 {item.location?.city || item.location}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchRow: { flexDirection: 'row', padding: 16, gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#0033A0',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabActive: { borderColor: '#0033A0', backgroundColor: '#EEF2FF' },
  tabLabel: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabLabelActive: { color: '#0033A0', fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', marginTop: 12, fontSize: 15 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#0033A0' },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 6 },
  cardLocation: { fontSize: 12, color: '#999' },
});
