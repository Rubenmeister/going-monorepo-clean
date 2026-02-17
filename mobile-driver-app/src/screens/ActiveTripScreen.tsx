import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

interface ActiveTripScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

type TripPhase = 'waiting' | 'heading_to_pickup' | 'arrived_at_pickup' | 'in_transit' | 'completed';

export const ActiveTripScreen = ({ onNavigate }: ActiveTripScreenProps) => {
  const { domain } = useMonorepoApp();
  const [phase, setPhase] = useState<TripPhase>('waiting');

  const tripData = {
    tripId: 'demo-trip-001',
    passengerId: 'passenger-001',
    passengerName: 'María García',
    pickup: { address: 'Av. Amazonas N36-152, Quito', lat: -0.1807, lng: -78.4678 },
    destination: { address: 'Centro Histórico, Quito', lat: -0.2200, lng: -78.5100 },
    price: '$8.50',
  };

  const advancePhase = () => {
    const phases: TripPhase[] = ['waiting', 'heading_to_pickup', 'arrived_at_pickup', 'in_transit', 'completed'];
    const currentIdx = phases.indexOf(phase);
    if (currentIdx < phases.length - 1) {
      setPhase(phases[currentIdx + 1]);
    }
  };

  const phaseConfig: Record<TripPhase, { label: string; color: string; action: string }> = {
    waiting: { label: 'Esperando Viaje', color: colors.gray[500], action: 'Aceptar Viaje' },
    heading_to_pickup: { label: 'Rumbo al Pasajero', color: colors.info, action: 'Llegué al Punto' },
    arrived_at_pickup: { label: 'En Punto de Recogida', color: colors.warning, action: 'Iniciar Viaje' },
    in_transit: { label: 'Viaje en Curso', color: colors.success, action: 'Completar Viaje' },
    completed: { label: 'Viaje Completado', color: colors.primary, action: 'Volver al Inicio' },
  };

  const config = phaseConfig[phase];

  return (
    <View style={styles.container}>
      {/* Phase Status */}
      <View style={[styles.phaseBar, { backgroundColor: config.color }]}>
        <Text style={styles.phaseLabel}>{config.label}</Text>
      </View>

      {/* Trip Details */}
      {phase !== 'waiting' && phase !== 'completed' && (
        <View style={styles.tripCard}>
          <View style={styles.passengerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>{tripData.passengerName}</Text>
              <Text style={styles.priceText}>{tripData.price} USD</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => onNavigate('Chat', { tripId: tripData.tripId, recipientId: tripData.passengerId })}
            >
              <Text style={styles.chatBtnText}>💬</Text>
            </TouchableOpacity>
          </View>

          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Recoger en</Text>
                <Text style={styles.routeAddress}>{tripData.pickup.address}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeAddress}>{tripData.destination.address}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Waiting State */}
      {phase === 'waiting' && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingIcon}>🚗</Text>
          <Text style={styles.waitingText}>Esperando solicitudes de viaje...</Text>
          <Text style={styles.waitingSubtext}>Mantente en línea para recibir viajes</Text>
        </View>
      )}

      {/* Completed State */}
      {phase === 'completed' && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>✅</Text>
          <Text style={styles.completedText}>¡Viaje completado!</Text>
          <Text style={styles.completedPrice}>{tripData.price} USD</Text>
          <Text style={styles.completedSubtext}>Ganancia registrada</Text>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: config.color }]}
          onPress={() => {
            if (phase === 'completed') {
              onNavigate('Dashboard');
            } else {
              advancePhase();
            }
          }}
        >
          <Text style={styles.actionButtonText}>{config.action}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  phaseBar: { paddingVertical: spacing.lg, alignItems: 'center' },
  phaseLabel: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.white },
  tripCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passengerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24 },
  passengerInfo: { flex: 1, marginLeft: spacing.sm },
  passengerName: { fontSize: fontSizes.base, fontWeight: '600', color: colors.gray[800] },
  priceText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.success },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtnText: { fontSize: 20 },
  routeContainer: { paddingLeft: spacing.sm },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start' },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: spacing.sm },
  routeTextContainer: { flex: 1 },
  routeLabel: { fontSize: fontSizes.xs, color: colors.gray[400] },
  routeAddress: { fontSize: fontSizes.sm, color: colors.gray[700], marginTop: 2 },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[300],
    marginLeft: 5,
    marginVertical: 4,
  },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingIcon: { fontSize: 64, marginBottom: spacing.md },
  waitingText: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.gray[600] },
  waitingSubtext: { fontSize: fontSizes.sm, color: colors.gray[400], marginTop: 4 },
  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  completedIcon: { fontSize: 64, marginBottom: spacing.md },
  completedText: { fontSize: fontSizes['2xl'], fontWeight: '700', color: colors.gray[800] },
  completedPrice: { fontSize: fontSizes['3xl'], fontWeight: '700', color: colors.success, marginTop: spacing.sm },
  completedSubtext: { fontSize: fontSizes.sm, color: colors.gray[500], marginTop: 4 },
  actionContainer: { padding: spacing.md },
  actionButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.white },
});
