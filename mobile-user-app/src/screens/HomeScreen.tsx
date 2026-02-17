import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

interface HomeScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { auth, domain } = useMonorepoApp();
  const [originAddress, setOriginAddress] = useState('Mi ubicación actual');
  const [destAddress, setDestAddress] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestTrip = async () => {
    if (!destAddress.trim()) {
      Alert.alert('Error', 'Ingresa un destino');
      return;
    }

    setIsRequesting(true);
    try {
      // Simulated coordinates - in production, use geocoding
      const result = await domain.transport.requestTrip.execute({
        userId: auth.user?.id || 'guest',
        origin: { address: originAddress, city: 'Quito', country: 'EC', latitude: -0.1807, longitude: -78.4678 },
        destination: { address: destAddress, city: 'Quito', country: 'EC', latitude: -0.2200, longitude: -78.5100 },
        price: { amount: 850, currency: 'USD' },
      }, 'token');

      if (result.isOk()) {
        onNavigate('TripTracking', { trip: result.value });
      } else {
        Alert.alert('Error', result.error.message);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo solicitar el viaje');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {auth.user ? `Hola, ${auth.user.firstName}` : 'Bienvenido'}
        </Text>
        <Text style={styles.subtitle}>¿A dónde vamos hoy?</Text>
      </View>

      {/* Trip Request Card */}
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <TextInput
            style={styles.input}
            value={originAddress}
            onChangeText={setOriginAddress}
            placeholder="Origen"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={styles.input}
            value={destAddress}
            onChangeText={setDestAddress}
            placeholder="¿A dónde vas?"
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.requestButton, isRequesting && styles.requestButtonDisabled]}
          onPress={handleRequestTrip}
          disabled={isRequesting}
        >
          <Text style={styles.requestButtonText}>
            {isRequesting ? 'Buscando conductor...' : 'Solicitar Viaje'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Servicios</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('Notifications')}>
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('TripTracking')}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>Mi Viaje</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('Chat')}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Section */}
      {!auth.user && (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => domain.auth.login.execute({ email: 'user@test.com', password: 'password123' })}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: spacing.md },
  header: { marginBottom: spacing.lg, marginTop: spacing.md },
  greeting: { fontSize: fontSizes['2xl'], fontWeight: 'bold', color: colors.gray[900] },
  subtitle: { fontSize: fontSizes.lg, color: colors.gray[500], marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  input: { flex: 1, fontSize: fontSizes.base, color: colors.gray[800], paddingVertical: spacing.xs },
  divider: { height: 1, backgroundColor: colors.gray[200], marginLeft: 20 },
  requestButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  requestButtonDisabled: { backgroundColor: colors.gray[300] },
  requestButtonText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: '600' },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.gray[800], marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionLabel: { fontSize: fontSizes.sm, color: colors.gray[600], textAlign: 'center' },
  loginButton: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loginButtonText: { color: colors.white, fontSize: fontSizes.base, fontWeight: '600' },
});
