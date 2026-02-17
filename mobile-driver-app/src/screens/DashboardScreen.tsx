import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

const DRIVER_ID = 'b737f525-45c5-41e9-9136-1c2517830d99';

interface DashboardScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const DashboardScreen = ({ onNavigate }: DashboardScreenProps) => {
  const { auth, domain } = useMonorepoApp();
  const [isOnline, setIsOnline] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: -0.1807, lng: -78.4678 });
  const [tripCount, setTripCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const broadcastLocation = async () => {
    // Simulate GPS with small random movement
    const lat = currentLocation.lat + (Math.random() - 0.5) * 0.002;
    const lng = currentLocation.lng + (Math.random() - 0.5) * 0.002;
    setCurrentLocation({ lat, lng });

    const result = await domain.tracking.broadcastDriverLocation.execute(
      { driverId: DRIVER_ID, latitude: lat, longitude: lng },
      'token',
    );

    if (result.isErr()) {
      console.warn('Broadcast error:', result.error.message);
    }
  };

  useEffect(() => {
    if (isBroadcasting) {
      broadcastLocation();
      intervalRef.current = setInterval(broadcastLocation, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isBroadcasting]);

  const toggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    setIsBroadcasting(newState);
    if (!newState) {
      Alert.alert('Modo Offline', 'Has dejado de recibir viajes.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={[styles.statusBar, isOnline ? styles.statusOnline : styles.statusOffline]}>
        <Text style={styles.statusText}>
          {isOnline ? '🟢 EN LÍNEA' : '⚫ FUERA DE LÍNEA'}
        </Text>
        <Text style={styles.statusSubtext}>
          {isBroadcasting ? 'Compartiendo ubicación...' : 'GPS detenido'}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tripCount}</Text>
          <Text style={styles.statLabel}>Viajes hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>$0.00</Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Location Display */}
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Tu ubicación</Text>
        <Text style={styles.locationCoords}>
          {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
        </Text>
        {isBroadcasting && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}
      </View>

      {/* Main Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, isOnline ? styles.toggleStop : styles.toggleStart]}
        onPress={toggleOnline}
      >
        <Text style={styles.toggleIcon}>{isOnline ? '⏸' : '▶'}</Text>
        <Text style={styles.toggleText}>
          {isOnline ? 'Desconectarse' : 'Comenzar a Conducir'}
        </Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('Chat')}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate('ActiveTrip')}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionLabel}>Viaje Activo</Text>
        </TouchableOpacity>
      </View>

      {/* Login prompt */}
      {!auth.user && (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => domain.auth.login.execute({ email: 'driver@test.com', password: 'password123' })}
        >
          <Text style={styles.loginText}>Iniciar Sesión como Conductor</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  statusBar: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statusOnline: { backgroundColor: colors.success },
  statusOffline: { backgroundColor: colors.gray[600] },
  statusText: { fontSize: fontSizes.xl, fontWeight: 'bold', color: colors.white },
  statusSubtext: { fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: { fontSize: fontSizes.xl, fontWeight: 'bold', color: colors.gray[800] },
  statLabel: { fontSize: fontSizes.xs, color: colors.gray[500], marginTop: 4 },
  locationCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationTitle: { fontSize: fontSizes.base, fontWeight: '600', color: colors.gray[700] },
  locationCoords: { fontSize: fontSizes.sm, color: colors.gray[500], marginTop: 4 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: 6,
  },
  liveText: { fontSize: fontSizes.xs, color: colors.error, fontWeight: '700' },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  toggleStart: { backgroundColor: colors.primary },
  toggleStop: { backgroundColor: colors.gray[700] },
  toggleIcon: { fontSize: 24, marginRight: spacing.sm },
  toggleText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.white },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionLabel: { fontSize: fontSizes.sm, color: colors.gray[600] },
  loginButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.gray[800],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  loginText: { color: colors.white, fontWeight: '600', fontSize: fontSizes.base },
});
