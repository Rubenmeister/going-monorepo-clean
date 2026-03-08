import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverStore } from '@store/useDriverStore';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';

const QUITO = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
const BG_LOCATION_TASK = 'going-driver-bg-location';

// Register background location task (no-op until WebSocket tracking is added)
TaskManager.defineTask(BG_LOCATION_TASK, ({ data: _data, error }: any) => {
  if (error) return;
});

type Nav = NativeStackNavigationProp<DriverMainStackParamList>;

export function DriverHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { driver, isOnline, pendingTrip, toggleOnline, pollPendingTrips } =
    useDriverStore();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Setup GPS on mount
  useEffect(() => {
    setupLocation();
  }, []);

  // Poll for pending trips every 5s while online
  useEffect(() => {
    if (!isOnline) return;
    pollPendingTrips();
    const id = setInterval(pollPendingTrips, 5000);
    return () => clearInterval(id);
  }, [isOnline, pollPendingTrips]);

  // Navigate to RideRequest when a pending trip arrives
  useEffect(() => {
    if (!pendingTrip) return;
    navigation.navigate('RideRequest', {
      rideId: pendingTrip.id,
      passengerId: pendingTrip.userId,
      origin: pendingTrip.origin.address,
      destination: pendingTrip.destination.address,
      amount: pendingTrip.price.amount,
    });
  }, [pendingTrip]);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setLocation(coords);
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      800
    );
  };

  const handleToggleOnline = async () => {
    if (!isOnline) {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu ubicación en segundo plano para que los pasajeros te encuentren.'
        );
        return;
      }
    }
    toggleOnline();
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={QUITO}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {location && (
          <Marker coordinate={location} title="Tu posición">
            <View
              style={[styles.carMarker, isOnline && styles.carMarkerOnline]}
            >
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Online/Offline toggle */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#10B981' : '#6B7280' },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'En línea — buscando viajes…' : 'Fuera de línea'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#fff"
          ios_backgroundColor="#D1D5DB"
        />
      </View>

      {/* Bottom panel */}
      <View style={styles.panel}>
        <Text style={styles.greeting}>Hola, {driver?.firstName} 👋</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={22} color="#FFCD00" />
            <Text style={styles.statValue}>
              {driver?.rating?.toFixed(1) || '5.0'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={22} color="#0033A0" />
            <Text style={styles.statValue}>{isOnline ? '✓' : '—'}</Text>
            <Text style={styles.statLabel}>Estado</Text>
          </View>
        </View>

        {!isOnline ? (
          <TouchableOpacity
            style={styles.goOnlineBtn}
            onPress={handleToggleOnline}
          >
            <Text style={styles.goOnlineBtnText}>Ponerse en línea</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingBanner}>
            <Ionicons
              name="radio-outline"
              size={18}
              color="#10B981"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.waitingText}>
              Esperando solicitudes de viaje…
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  carMarker: {
    backgroundColor: '#6B7280',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  carMarkerOnline: { backgroundColor: '#0033A0' },
  statusBar: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  goOnlineBtn: {
    backgroundColor: '#FFCD00',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  goOnlineBtnText: { color: '#0033A0', fontSize: 16, fontWeight: '900' },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  waitingText: { color: '#065F46', fontSize: 14, fontWeight: '600' },
});
