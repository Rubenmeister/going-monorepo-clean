import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverStore } from '@store/useDriverStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import {
  analyticsDriverOnline,
  analyticsDriverOffline,
  analyticsScreen,
} from '../../utils/analytics';
import { API_BASE_URL } from '../../utils/constants';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

// Default center: Quito, Ecuador [lng, lat]
const QUITO_COORD: [number, number] = [-78.4678, -0.1807];
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
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [docAlerts, setDocAlerts] = useState<{ label: string; daysLeft: number; urgent: boolean }[]>([]);
  const onlineStartRef = useRef<number | null>(null);

  // Métricas del día
  const [todayStats, setTodayStats] = useState({
    trips: 0,
    earnings: 0,
    acceptanceRate: 0,
    avgRating: 5.0,
  });

  // Zonas calientes (demo — en producción vendría de la API)
  const HOT_ZONES: { name: string; intensity: 'alta' | 'media'; coord: [number, number] }[] = [
    { name: 'El Quicentro', intensity: 'alta',  coord: [-78.4833, -0.1862] },
    { name: 'La Mariscal',  intensity: 'alta',  coord: [-78.4900, -0.2100] },
    { name: 'Aeropuerto',   intensity: 'media', coord: [-78.3583, -0.1290] },
    { name: 'Cumbayá',      intensity: 'media', coord: [-78.4369, -0.2000] },
  ];

  useEffect(() => { analyticsScreen('DriverHomeScreen'); }, []);

  // Cargar métricas del día
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('driver_token');
        const { data } = await axios.get(
          `${API_BASE_URL}/drivers/me/stats/today`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTodayStats({
          trips:          data.trips          ?? 0,
          earnings:       data.earnings        ?? 0,
          acceptanceRate: data.acceptanceRate  ?? 0,
          avgRating:      data.avgRating        ?? 5.0,
        });
      } catch {
        // API no disponible aún — mantener defaults
      }
    })();
  }, []);

  // Verificar documentos al montar
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('driver_token');
        const { data } = await axios.get(
          `${API_BASE_URL}/drivers/me/documents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const today = new Date();
        const alerts: { label: string; daysLeft: number; urgent: boolean }[] = [];
        for (const doc of (data.documents ?? [])) {
          if (!doc.expiresAt) continue;
          const daysLeft = Math.ceil((new Date(doc.expiresAt).getTime() - today.getTime()) / 86400000);
          if (daysLeft <= 30) alerts.push({ label: doc.name, daysLeft, urgent: daysLeft <= 7 });
        }
        setDocAlerts(alerts);
      } catch {
        // Demo: SOAT próximo a vencer
        setDocAlerts([{ label: 'SOAT', daysLeft: 5, urgent: true }]);
      }
    })();
  }, []);

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
    const coords: [number, number] = [
      loc.coords.longitude,
      loc.coords.latitude,
    ];
    setLocation(coords);
    cameraRef.current?.setCamera({
      centerCoordinate: coords,
      zoomLevel: 15,
      animationDuration: 800,
    });
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
    if (!isOnline) {
      onlineStartRef.current = Date.now();
      analyticsDriverOnline();
    } else {
      const mins = onlineStartRef.current
        ? Math.round((Date.now() - onlineStartRef.current) / 60000)
        : 0;
      analyticsDriverOffline(mins);
      onlineStartRef.current = null;
    }
    toggleOnline();
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.DarkV11}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={location ?? QUITO_COORD}
          animationMode="flyTo"
        />
        <MapboxGL.UserLocation
          visible
          renderMode={MapboxGL.UserLocationRenderMode.Normal}
        />
        {location && (
          <MapboxGL.PointAnnotation id="driver-location" coordinate={location}>
            <View
              style={[styles.carMarker, isOnline && styles.carMarkerOnline]}
            >
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}
        {/* Marcadores de zonas calientes en el mapa */}
        {isOnline && HOT_ZONES.map((zone) => (
          <MapboxGL.PointAnnotation
            key={`zone-${zone.name}`}
            id={`zone-${zone.name}`}
            coordinate={zone.coord}
          >
            <View style={[styles.zoneMarker, zone.intensity === 'alta' && styles.zoneMarkerHot]}>
              <Text style={styles.zoneMarkerEmoji}>🔥</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

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

        {/* Alertas de documentos por vencer */}
        {docAlerts.map((alert, i) => (
          <View key={i} style={[styles.docAlert, alert.urgent && styles.docAlertUrgent]}>
            <Ionicons
              name={alert.urgent ? 'warning' : 'time-outline'}
              size={16}
              color={alert.urgent ? '#fff' : '#F59E0B'}
            />
            <Text style={[styles.docAlertText, alert.urgent && styles.docAlertTextUrgent]}>
              {alert.urgent
                ? `⚠️ ${alert.label} vence en ${alert.daysLeft} días — Renuévalo ahora`
                : `${alert.label} vence en ${alert.daysLeft} días`}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={alert.urgent ? '#fff' : '#9CA3AF'}
            />
          </View>
        ))}

        {/* Métricas del día — 4 tarjetas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car-outline" size={20} color="#0033A0" />
            <Text style={styles.statValue}>{todayStats.trips}</Text>
            <Text style={styles.statLabel}>Viajes hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color="#059669" />
            <Text style={[styles.statValue, { color: '#059669' }]}>
              ${todayStats.earnings.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Ganado hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={20} color="#FFCD00" />
            <Text style={styles.statValue}>{todayStats.avgRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.statValue}>{todayStats.acceptanceRate}%</Text>
            <Text style={styles.statLabel}>Aceptación</Text>
          </View>
        </View>

        {/* Zonas calientes */}
        {isOnline && (
          <>
            <Text style={styles.zonesLabel}>🔥 Zonas con alta demanda ahora</Text>
            <View style={styles.zonesRow}>
              {HOT_ZONES.map((zone) => (
                <View
                  key={zone.name}
                  style={[styles.zoneChip, zone.intensity === 'alta' && styles.zoneChipHot]}
                >
                  <Text style={[styles.zoneChipText, zone.intensity === 'alta' && styles.zoneChipTextHot]}>
                    {zone.name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

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
  docAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  docAlertUrgent: {
    backgroundColor: '#FF4C41',
    borderColor: '#FF4C41',
  },
  docAlertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  docAlertTextUrgent: {
    color: '#FFFFFF',
  },
  // Zonas calientes — chips en panel
  zonesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  zonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  zoneChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  zoneChipHot: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  zoneChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  zoneChipTextHot: {
    color: '#991B1B',
  },
  // Marcadores de zonas calientes en el mapa
  zoneMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(253,211,36,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneMarkerHot: {
    backgroundColor: 'rgba(255,76,65,0.85)',
  },
  zoneMarkerEmoji: {
    fontSize: 16,
  },
});
