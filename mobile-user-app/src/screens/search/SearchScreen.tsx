import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/MainNavigator';
import { searchAPI } from '../../services/api';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

// ── Regiones de Ecuador (rutas iniciales Going) ──────────────────────────────
type RegionId = 'todas' | 'sierra_norte' | 'sierra_centro' | 'costa' | 'aeropuerto';

const REGIONS: { id: RegionId; label: string; cities: string[]; icon: string }[] = [
  { id: 'todas',          label: 'Todas',          cities: [],                                    icon: 'globe-outline' },
  { id: 'sierra_norte',   label: 'Sierra Norte',   cities: ['Quito', 'Ibarra', 'Otavalo'],       icon: 'trail-sign-outline' },
  { id: 'sierra_centro',  label: 'Sierra Centro',  cities: ['Ambato', 'Latacunga', 'Riobamba'],   icon: 'mountain-outline' },
  { id: 'costa',          label: 'Costa',           cities: ['Santo Domingo', 'Esmeraldas'],       icon: 'sunny-outline' },
  { id: 'aeropuerto',     label: 'Aeropuerto',      cities: ['Aeropuerto Quito'],                  icon: 'airplane-outline' },
];

// ── Tipos de servicio ────────────────────────────────────────────────────────
type ServiceTab = 'tours' | 'accommodations' | 'experiences';

const SERVICE_TABS: { id: ServiceTab; label: string; icon: string }[] = [
  { id: 'tours',          label: 'Tours',       icon: 'map-outline' },
  { id: 'accommodations', label: 'Hospedaje',   icon: 'bed-outline' },
  { id: 'experiences',    label: 'Experiencias', icon: 'star-outline' },
];

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  city?: string;
  price?: number;
  rating?: number;
  imageUrl?: string;
}

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ServiceTab>('tours');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('todas');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Buscar al cambiar tab o región ─────────────────────────────────────────
  useEffect(() => {
    fetchResults();
  }, [activeTab, selectedRegion]);

  const fetchResults = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const region = REGIONS.find(r => r.id === selectedRegion);
      const cityParam = region && region.cities.length > 0 ? region.cities[0] : undefined;

      let data: any;
      switch (activeTab) {
        case 'tours':
          data = (await searchAPI.tours({ city: cityParam })).data;
          break;
        case 'accommodations':
          data = (await searchAPI.accommodations({ city: cityParam })).data;
          break;
        case 'experiences':
          data = (await searchAPI.experiences({ city: cityParam })).data;
          break;
      }

      const items: SearchResult[] = Array.isArray(data) ? data : data?.results ?? data?.items ?? [];

      // Filtro local por texto
      const filtered = query.trim()
        ? items.filter(i =>
            i.name?.toLowerCase().includes(query.toLowerCase()) ||
            i.description?.toLowerCase().includes(query.toLowerCase()) ||
            i.city?.toLowerCase().includes(query.toLowerCase())
          )
        : items;

      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResults();
  };

  // ── Render card ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardIcon}>
        <Ionicons
          name={SERVICE_TABS.find(t => t.id === activeTab)?.icon as any ?? 'bookmark-outline'}
          size={24}
          color={GOING_BLUE}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {item.city && (
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.cityText}>{item.city}</Text>
          </View>
        )}
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
        {item.rating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={GOING_YELLOW} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      {item.price != null && (
        <Text style={styles.cardPrice}>${item.price}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Buscar destinos, tours, hospedaje..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); fetchResults(); }}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs de servicio */}
      <View style={styles.tabsRow}>
        {SERVICE_TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon as any} size={16} color={active ? '#fff' : GOING_BLUE} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filtro por región */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionsRow}
      >
        {REGIONS.map(region => {
          const active = region.id === selectedRegion;
          return (
            <TouchableOpacity
              key={region.id}
              style={[styles.regionChip, active && styles.regionChipActive]}
              onPress={() => setSelectedRegion(region.id)}
            >
              <Ionicons
                name={region.icon as any}
                size={14}
                color={active ? GOING_BLUE : '#6B7280'}
              />
              <Text style={[styles.regionText, active && styles.regionTextActive]}>
                {region.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Resultados */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOING_BLUE} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearched ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            No hay resultados{selectedRegion !== 'todas' ? ` en ${REGIONS.find(r => r.id === selectedRegion)?.label}` : ''}
          </Text>
          <Text style={styles.emptyHint}>Prueba otra región o categoría</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={56} color="#D1D5DB" />
          <Text style={styles.hintText}>Explora destinos Going en Ecuador</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 10, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  input: { flex: 1, fontSize: 15, color: '#111827', marginHorizontal: 8 },

  // Service tabs
  tabsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  tabActive: { backgroundColor: GOING_BLUE, borderColor: GOING_BLUE },
  tabText: { fontSize: 12, fontWeight: '700', color: GOING_BLUE },
  tabTextActive: { color: '#fff' },

  // Regions
  regionsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  regionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  regionChipActive: {
    backgroundColor: `${GOING_YELLOW}30`, borderColor: GOING_YELLOW,
  },
  regionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  regionTextActive: { color: GOING_BLUE },

  // Results list
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cityText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  cardDesc: { fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  cardPrice: { fontSize: 16, fontWeight: '900', color: '#059669', marginLeft: 8 },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  emptyText: { color: '#6B7280', fontSize: 15, marginTop: 12, textAlign: 'center' },
  emptyHint: { color: '#9CA3AF', fontSize: 13, marginTop: 4, textAlign: 'center' },
  hintText: { color: '#9CA3AF', fontSize: 14, marginTop: 12, textAlign: 'center' },
});
