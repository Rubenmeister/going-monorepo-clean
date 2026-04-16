/**
 * LocationPickerScreen — Selector de ubicación con mapa y pin arrastrable
 *
 * Funciona como Uber/Cabify: el mapa se mueve debajo de un pin fijo en el centro.
 * Cuando el usuario deja de mover el mapa → geocodifica la ubicación del pin.
 *
 * Props (via route.params):
 *   title      — "Dirección de recogida" | "Dirección de entrega" | etc.
 *   mode       — 'origin' | 'destination'
 *   accentColor— color del pin y botón (verde, rojo, navy, etc.)
 *   onConfirm  — callback key para devolver la ubicación al screen anterior
 *
 * Devuelve via navigation.navigate(returnScreen, { [paramKey]: { address, latitude, longitude } })
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Keyboard,
  TextInput, FlatList, Dimensions,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hapticLight, hapticMedium } from '../../utils/haptics';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const { width, height } = Dimensions.get('window');
const NAVY  = '#0033A0';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type LocationResult = {
  address:   string;
  latitude:  number;
  longitude: number;
};

export type LocationPickerParams = {
  title:        string;
  mode:         'origin' | 'destination';
  accentColor?: string;
  returnScreen: string;
  paramKey:     string;
  initialLat?:  number;
  initialLng?:  number;
};

type Nav = NativeStackNavigationProp<any>;

// ── Constantes ────────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [-78.4678, -0.1807]; // Quito
const GEOCODE_DEBOUNCE_MS = 800;

// ─────────────────────────────────────────────────────────────────────────────

export function LocationPickerScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: LocationPickerParams }, 'params'>>();
  const {
    title, mode, accentColor = NAVY,
    returnScreen, paramKey,
    initialLat, initialLng,
  } = route.params;

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const geocodeTimer = useRef<NodeJS.Timeout>();

  const [center,       setCenter]      = useState<[number, number]>(
    initialLat && initialLng ? [initialLng, initialLat] : DEFAULT_CENTER
  );
  const [address,      setAddress]     = useState('');
  const [loading,      setLoading]     = useState(false);
  const [confirming,   setConfirming]  = useState(false);
  const [searchText,   setSearchText]  = useState('');
  const [suggestions,  setSuggestions] = useState<any[]>([]);
  const [showSearch,   setShowSearch]  = useState(false);
  const [userLocation, setUserLocation]= useState<[number, number] | null>(null);

  // Animación del pin al mover el mapa
  const pinY = useRef(new Animated.Value(0)).current;

  // ── Ubicación actual del usuario ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setUserLocation(coords);
      if (!initialLat && !initialLng) {
        setCenter(coords);
        cameraRef.current?.setCamera({ centerCoordinate: coords, zoomLevel: 15, animationDuration: 800 });
        geocodeCoords(coords[0], coords[1]);
      }
    })();
  }, []);

  // Geocodificación inversa: coordenadas → dirección legible
  const geocodeCoords = async (lng: number, lat: number) => {
    setLoading(true);
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,place&limit=1&language=es&country=EC&access_token=${token}`
      );
      const json = await res.json();
      const place = json.features?.[0];
      setAddress(place?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda por texto (autocomplete Mapbox)
  const searchAddress = async (text: string) => {
    if (!text || text.length < 3) { setSuggestions([]); return; }
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?country=EC&language=es&limit=5&access_token=${token}`
      );
      const json = await res.json();
      setSuggestions(json.features ?? []);
    } catch {}
  };

  // Debounce de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => searchAddress(text), 500);
  };

  // Seleccionar sugerencia
  const handleSelectSuggestion = (item: any) => {
    const [lng, lat] = item.center;
    const newCenter: [number, number] = [lng, lat];
    setCenter(newCenter);
    setAddress(item.place_name);
    setSearchText(item.place_name);
    setSuggestions([]);
    setShowSearch(false);
    Keyboard.dismiss();
    cameraRef.current?.setCamera({ centerCoordinate: newCenter, zoomLevel: 15, animationDuration: 600 });
    hapticLight();
  };

  // El mapa se mueve → el pin "flota"
  const handleMapMove = () => {
    Animated.spring(pinY, { toValue: -12, useNativeDriver: true, tension: 200 }).start();
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
  };

  // El mapa para → el pin "cae" y geocodifica
  const handleMapIdle = (feature: any) => {
    Animated.spring(pinY, { toValue: 0, useNativeDriver: true, friction: 4 }).start();
    const [lng, lat] = feature.properties?.center ?? center;
    const newCenter: [number, number] = [lng, lat];
    setCenter(newCenter);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => geocodeCoords(lng, lat), GEOCODE_DEBOUNCE_MS);
  };

  // Ir a mi ubicación
  const goToMyLocation = () => {
    if (!userLocation) return;
    hapticLight();
    cameraRef.current?.setCamera({ centerCoordinate: userLocation, zoomLevel: 16, animationDuration: 600 });
    setCenter(userLocation);
    geocodeCoords(userLocation[0], userLocation[1]);
  };

  // Confirmar y volver
  const handleConfirm = () => {
    if (!address || loading) return;
    hapticMedium();
    setConfirming(true);
    const result: LocationResult = {
      address,
      latitude:  center[1],
      longitude: center[0],
    };
    navigation.navigate(returnScreen, { [paramKey]: result });
  };

  const pinColor = mode === 'origin' ? accentColor : '#ff4c41';

  return (
    <View style={styles.container}>

      {/* ── MAPA ───────────────────────────────────────────────────────── */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onRegionIsChanging={handleMapMove}
        onRegionDidChange={handleMapIdle}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={center}
          animationMode="flyTo"
        />
        <MapboxGL.UserLocation visible renderMode={MapboxGL.UserLocationRenderMode.Normal} />
      </MapboxGL.MapView>

      {/* ── PIN CENTRAL (fijo, el mapa se mueve debajo) ────────────────── */}
      <View style={styles.pinContainer} pointerEvents="none">
        {/* Sombra del pin en el suelo */}
        <Animated.View
          style={[
            styles.pinShadow,
            { opacity: pinY.interpolate({ inputRange: [-12, 0], outputRange: [0.3, 0.6] }) },
          ]}
        />
        {/* Pin animado */}
        <Animated.View style={[styles.pin, { transform: [{ translateY: pinY }] }]}>
          <View style={[styles.pinHead, { backgroundColor: pinColor }]}>
            <Ionicons
              name={mode === 'origin' ? 'navigate' : 'location'}
              size={18}
              color="#fff"
            />
          </View>
          <View style={[styles.pinTail, { borderTopColor: pinColor }]} />
        </Animated.View>
      </View>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => { setShowSearch(true); }}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color={accentColor} />
          {showSearch ? (
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearchChange}
              placeholder="Buscar dirección..."
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="search"
            />
          ) : (
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {address || 'Buscar dirección...'}
            </Text>
          )}
          {showSearch && (
            <TouchableOpacity onPress={() => { setShowSearch(false); setSuggestions([]); Keyboard.dismiss(); }}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Sugerencias */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionDivider]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                <Text style={styles.suggestionText} numberOfLines={2}>{item.place_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── BOTÓN MI UBICACIÓN ─────────────────────────────────────────── */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={goToMyLocation}>
        <Ionicons name="navigate" size={20} color={accentColor} />
      </TouchableOpacity>

      {/* ── BOTTOM CARD: dirección + confirmar ─────────────────────────── */}
      <View style={styles.bottomCard}>
        <View style={styles.addressRow}>
          <View style={[styles.addressDot, { backgroundColor: pinColor }]} />
          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={styles.loadingText}>Obteniendo dirección...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.addressLabel}>
                  {mode === 'origin' ? 'ORIGEN' : 'DESTINO'}
                </Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address || 'Mueve el mapa para ajustar la ubicación'}
                </Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.hint}>
          Mueve el mapa para ajustar el pin exactamente en tu ubicación
        </Text>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: accentColor },
            (!address || loading) && { opacity: 0.5 },
          ]}
          onPress={handleConfirm}
          disabled={!address || loading || confirming}
          activeOpacity={0.85}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirmar ubicación</Text>
              <Ionicons name="checkmark-circle" size={22} color="rgba(255,255,255,0.8)" />
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { ...StyleSheet.absoluteFillObject },

  // Pin central fijo
  pinContainer: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: [{ translateX: -20 }, { translateY: -52 }],
    alignItems: 'center',
    zIndex: 10,
  },
  pin:       { alignItems: 'center' },
  pinHead: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  pinTail: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
  pinShadow: {
    width: 20, height: 8, borderRadius: 10,
    backgroundColor: '#000',
    marginTop: 4,
  },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Search
  searchContainer: {
    position: 'absolute', top: 110, left: 16, right: 16, zIndex: 20,
  },
  searchBar: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#111827', padding: 0,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  suggestionsBox: {
    backgroundColor: '#fff', borderRadius: 16, marginTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, paddingHorizontal: 14,
  },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  // My location button
  myLocationBtn: {
    position: 'absolute', right: 16, bottom: 220, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 34,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.10, shadowRadius: 10, elevation: 10,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  addressDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, flexShrink: 0 },
  addressLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 2 },
  addressText: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#9CA3AF' },
  hint: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 14 },
  confirmBtn: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  confirmBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
