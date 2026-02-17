import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

interface TripTrackingScreenProps {
  tripId?: string;
  driverId?: string;
  onNavigate: (screen: string, params?: any) => void;
}

export const TripTrackingScreen = ({ tripId, driverId, onNavigate }: TripTrackingScreenProps) => {
  const { domain } = useMonorepoApp();
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    etaMinutes: number | null;
    updatedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo IDs for testing
  const activeTripId = tripId || 'demo-trip-001';
  const activeDriverId = driverId || 'b737f525-45c5-41e9-9136-1c2517830d99';

  const fetchDriverLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await domain.tracking.trackDriverForTrip.execute(
        activeTripId,
        activeDriverId,
        'token',
        -0.2200, // destination lat
        -78.5100, // destination lng
      );
      if (result.isOk()) {
        setDriverLocation(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (e) {
      setError('No se pudo obtener la ubicación');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverLocation();
    const interval = setInterval(fetchDriverLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Mapa en tiempo real</Text>
        {driverLocation && (
          <View style={styles.mapCoords}>
            <Text style={styles.coordsText}>
              📍 Conductor: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
        {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
      </View>

      {/* Trip Info Card */}
      <View style={styles.infoCard}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDriverLocation}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ETA Display */}
            <View style={styles.etaRow}>
              <View style={styles.etaContainer}>
                <Text style={styles.etaValue}>
                  {driverLocation?.etaMinutes
                    ? `${Math.round(driverLocation.etaMinutes)}`
                    : '--'}
                </Text>
                <Text style={styles.etaLabel}>min</Text>
              </View>
              <View style={styles.etaInfo}>
                <Text style={styles.tripStatus}>Tu conductor está en camino</Text>
                <Text style={styles.updateTime}>
                  Actualizado: {driverLocation?.updatedAt || '...'}
                </Text>
              </View>
            </View>

            {/* Driver Info */}
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarText}>🚗</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Conductor</Text>
                <Text style={styles.vehicleInfo}>Toyota Corolla - ABC 123</Text>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => onNavigate('Chat', { tripId: activeTripId, recipientId: activeDriverId })}
              >
                <Text style={styles.chatButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[100] },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  mapText: { fontSize: fontSizes['2xl'], color: colors.gray[500] },
  mapCoords: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  coordsText: { fontSize: fontSizes.sm, color: colors.gray[700] },
  infoCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  etaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  etaContainer: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  etaValue: { fontSize: fontSizes['2xl'], fontWeight: 'bold', color: colors.white },
  etaLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)' },
  etaInfo: { flex: 1 },
  tripStatus: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.gray[800] },
  updateTime: { fontSize: fontSizes.sm, color: colors.gray[400], marginTop: 2 },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontSize: 24 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: fontSizes.base, fontWeight: '600', color: colors.gray[800] },
  vehicleInfo: { fontSize: fontSizes.sm, color: colors.gray[500] },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: { fontSize: 20 },
  errorContainer: { alignItems: 'center', padding: spacing.md },
  errorText: { color: colors.error, fontSize: fontSizes.base, marginBottom: spacing.sm },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryText: { color: colors.white, fontWeight: '600' },
});
