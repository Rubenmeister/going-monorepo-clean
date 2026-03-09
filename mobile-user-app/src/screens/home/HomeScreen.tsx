import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const GOING_BLUE = '#0033A0'; // Aligned with driver app brand color
const GOING_YELLOW = '#FFCD00'; // Aligned with driver app brand color

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState<
    'taxi' | 'delivery' | 'tour'
  >('taxi');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const services = [
    { id: 'taxi' as const, label: '🚗 Taxi', color: GOING_BLUE },
    { id: 'delivery' as const, label: '📦 Envío', color: '#E53935' },
    { id: 'tour' as const, label: '🏔️ Tour', color: '#43A047' },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation([loc.coords.longitude, loc.coords.latitude]);
      cameraRef.current?.setCamera({
        centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    })();
  }, []);

  const handleRideRequest = async () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu destino.');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Esperando tu ubicación…');
      return;
    }
    setLoading(true);
    try {
      await api.requestRide({
        originLat: location[1],
        originLng: location[0],
        destinationAddress: destination,
        serviceType: selectedService,
      });
      Alert.alert('¡Solicitud enviada!', 'Buscando conductor cercano…');
    } catch {
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── MAP ── */}
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={location ?? [-78.4678, -0.1807]} // default: Quito, Ecuador
          animationMode="flyTo"
        />
        {location && (
          <MapboxGL.PointAnnotation id="user-location" coordinate={location}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
        <MapboxGL.UserLocation
          visible
          renderMode={MapboxGL.UserLocationRenderMode.Normal}
        />
      </MapboxGL.MapView>

      {/* ── BOTTOM CARD ── */}
      <View style={styles.card}>
        <Text style={styles.greeting}>
          ¡Hola, {user?.name?.split(' ')[0] ?? 'viajero'}! 👋
        </Text>

        {/* Service selector */}
        <View style={styles.serviceRow}>
          {services.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[
                styles.serviceBtn,
                selectedService === svc.id && { backgroundColor: svc.color },
              ]}
              onPress={() => setSelectedService(svc.id)}
            >
              <Text
                style={[
                  styles.serviceBtnText,
                  selectedService === svc.id && { color: '#fff' },
                ]}
              >
                {svc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination input */}
        <TextInput
          style={styles.input}
          placeholder="¿A dónde vas?"
          placeholderTextColor="#999"
          value={destination}
          onChangeText={setDestination}
          returnKeyType="search"
        />

        {/* Request button */}
        <TouchableOpacity
          style={[styles.requestBtn, loading && { opacity: 0.7 }]}
          onPress={handleRideRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.requestBtnText}>Solicitar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOING_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 14,
  },
  serviceRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  serviceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  serviceBtnText: { fontSize: 13, fontWeight: '600', color: '#444' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    marginBottom: 14,
    backgroundColor: '#f9f9f9',
  },
  requestBtn: {
    backgroundColor: GOING_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
