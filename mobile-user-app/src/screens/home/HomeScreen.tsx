import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/useAuthStore';
import { searchAPI, transportAPI } from '@services/api';

const { width } = Dimensions.get('window');

// Default center: Quito, Ecuador
const QUITO: Region = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function HomeScreen() {
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(QUITO);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [destination, setDestination] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setIsLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu ubicación para encontrar transporte cercano.'
      );
      setIsLocating(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setUserLocation(coords);
    const newRegion = {
      ...coords,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
    setIsLocating(false);
  };

  const handleRequestRide = async () => {
    if (!userLocation) {
      Alert.alert('Ubicación requerida', 'Activa tu GPS primero.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Destino requerido', 'Ingresa a dónde quieres ir.');
      return;
    }
    setIsRequesting(true);
    try {
      await transportAPI.requestRide({
        origin: { ...userLocation, address: 'Mi ubicación actual' },
        destination: {
          latitude: QUITO.latitude - 0.01,
          longitude: QUITO.longitude + 0.01,
          address: destination,
        },
        serviceType: 'PRIVATE',
      });
      Alert.alert('¡Listo!', 'Tu solicitud fue enviada. Buscando conductor...');
      setDestination('');
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || 'No se pudo solicitar el viaje.'
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {userLocation && (
          <Marker coordinate={userLocation} title="Tu ubicación">
            <View style={styles.userMarker}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          ¡Hola, {user?.firstName || 'Usuario'}! 👋
        </Text>
        <Text style={styles.subGreeting}>¿A dónde vamos hoy?</Text>
      </View>

      {/* Recenter button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={requestLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color="#0033A0" />
        ) : (
          <Ionicons name="locate" size={22} color="#0033A0" />
        )}
      </TouchableOpacity>

      {/* Bottom sheet: destination input */}
      <View style={styles.bottomSheet}>
        <View style={styles.destinationRow}>
          <Ionicons
            name="search"
            size={20}
            color="#0033A0"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.destinationInput}
            placeholder="¿A dónde vas?"
            placeholderTextColor="#9CA3AF"
            value={destination}
            onChangeText={setDestination}
            returnKeyType="search"
          />
        </View>

        {/* Service types */}
        <View style={styles.serviceRow}>
          {[
            { icon: 'car', label: 'Privado' },
            { icon: 'people', label: 'Compartido' },
            { icon: 'cube', label: 'Envíos' },
          ].map(({ icon, label }) => (
            <TouchableOpacity key={label} style={styles.serviceCard}>
              <Ionicons name={icon as any} size={22} color="#0033A0" />
              <Text style={styles.serviceLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.requestBtn, isRequesting && styles.requestBtnDisabled]}
          onPress={handleRequestRide}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator color="#0033A0" />
          ) : (
            <Text style={styles.requestBtnText}>Solicitar Viaje</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0,51,160,0.92)',
    borderRadius: 14,
    padding: 14,
  },
  greeting: { color: '#FFCD00', fontSize: 16, fontWeight: '800' },
  subGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  recenterBtn: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  userMarker: {
    backgroundColor: '#0033A0',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFCD00',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  destinationInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  serviceCard: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  serviceLabel: {
    color: '#0033A0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  requestBtn: {
    backgroundColor: '#FFCD00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestBtnDisabled: { opacity: 0.7 },
  requestBtnText: { color: '#0033A0', fontSize: 17, fontWeight: '900' },
});
