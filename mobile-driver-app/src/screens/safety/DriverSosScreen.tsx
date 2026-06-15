/**
 * DriverSosScreen — Emergencia / SOS para la conductora o el conductor.
 *
 * Espeja la SosScreen del pasajero pero en el contexto del conductor:
 *   1. ECU 911           → tel:911 directo (+ POST /sos en background)
 *   2. Notificar contactos → Share nativo con ubicación + viaje en curso
 *   3. Soporte Going App  → POST /sos al emergency-service → ops Telegram
 *
 * Self-contained con las convenciones del driver-app (axios `api`, useDriverStore,
 * expo-location, StyleSheet plano). El fondo rojo es identidad de emergencia.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Share,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { useDriverStore } from '@store/useDriverStore';
import { api } from '../../services/api';

type Nav = NativeStackNavigationProp<DriverMainStackParamList, 'DriverSos'>;

type EmergencyType =
  | 'medical'
  | 'accident'
  | 'robbery'
  | 'harassment'
  | 'vehicle_breakdown'
  | 'other';

const EMERGENCY_TYPES: Array<{ id: EmergencyType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { id: 'robbery',           label: 'Robo / Asalto',     icon: 'alert-circle'  },
  { id: 'harassment',        label: 'Acoso / Amenaza',   icon: 'warning'       },
  { id: 'accident',          label: 'Accidente',         icon: 'car'           },
  { id: 'medical',           label: 'Médica',            icon: 'medkit'        },
  { id: 'vehicle_breakdown', label: 'Vehículo averiado', icon: 'construct'     },
  { id: 'other',             label: 'Otra emergencia',   icon: 'help-circle'   },
];

const EMERGENCY_NUMBERS = [
  { label: 'ECU 911',          number: '911', icon: 'call'   as const, accent: '#dc2626' },
  { label: 'Policía Nacional', number: '101', icon: 'shield' as const, accent: '#1e40af' },
  { label: 'Cruz Roja',        number: '131', icon: 'medkit' as const, accent: '#dc2626' },
  { label: 'Bomberos',         number: '102', icon: 'flame'  as const, accent: '#ea580c' },
];

const HERO_RED = '#DC2626';

export function DriverSosScreen() {
  const navigation = useNavigation<Nav>();
  const { driver, currentRideId } = useDriverStore();

  const [emergencyType, setEmergencyType] = useState<EmergencyType>('other');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');

  const getFreshGPS = useCallback(async (): Promise<{ lat: number; lng: number; accuracyM?: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracyM: loc.coords.accuracy ?? undefined,
      };
    } catch {
      return null;
    }
  }, []);

  const postSos = useCallback(
    async (emergencyDialerTriggered = false): Promise<boolean> => {
      if (!driver?.id) {
        Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para enviar la alerta.');
        return false;
      }
      const gps = await getFreshGPS();
      if (!gps) {
        Alert.alert(
          'GPS requerido',
          'No pudimos obtener tu ubicación. Activa el GPS e intenta de nuevo. Si es urgente, llama al 911 directamente.',
        );
        return false;
      }
      try {
        const note = description.trim();
        await api.post('/sos', {
          userId: driver.id,
          channel: 'mobile',
          emergencyType,
          description: note ? `[CONDUCTOR] ${note}` : '[CONDUCTOR] Alerta de seguridad',
          location: { lat: gps.lat, lng: gps.lng },
          accuracyM: gps.accuracyM,
          rideId: currentRideId ?? undefined,
          emergencyDialerTriggered,
        });
        return true;
      } catch (err) {
        console.warn('[DriverSOS] backend /sos failed:', err);
        return false;
      }
    },
    [driver?.id, emergencyType, description, currentRideId, getFreshGPS],
  );

  // 1 — ECU 911
  const handleCall911 = useCallback(() => {
    Linking.openURL('tel:911').catch(() =>
      Alert.alert('Error', 'No se puede hacer la llamada desde este dispositivo.'),
    );
    postSos(true).catch(() => {});
  }, [postSos]);

  // 2 — Notificar contactos
  const handleNotifyContacts = useCallback(async () => {
    const gps = await getFreshGPS();
    const mapsLink = gps ? `https://maps.google.com/?q=${gps.lat},${gps.lng}` : '';
    const msg = [
      '🆘 *ALERTA DE SEGURIDAD - Conductor Going App*',
      '',
      'Soy conductor de Going App y te comparto mi ubicación.',
      '',
      driver?.vehiclePlate ? `🚗 Placa: ${driver.vehiclePlate}` : null,
      currentRideId ? `🔑 Viaje: ${currentRideId.slice(0, 8).toUpperCase()}` : null,
      mapsLink ? `📌 Ubicación actual: ${mapsLink}` : null,
      '',
      'Enviado desde la app de conductores de Going App.',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await Share.share({ message: msg, title: 'Alerta Going App' });
    } catch {
      /* cancelado */
    }
  }, [driver?.vehiclePlate, currentRideId, getFreshGPS]);

  // 3 — Alertar a Going App
  const handleAlertGoing = useCallback(async () => {
    setSending(true);
    const ok = await postSos(false);
    setSending(false);
    if (ok) {
      setResult('success');
      Alert.alert(
        '🆘 Alerta enviada',
        'Going App recibió tu alerta. Un agente de seguridad la está revisando y se coordinará con autoridades si es necesario.',
        [{ text: 'OK' }],
      );
    } else {
      setResult('error');
      Alert.alert(
        'Error de red',
        'No pudimos enviar la alerta al servidor. Llama al 911 directamente o notifica a tus contactos.',
        [{ text: 'Reintentar', onPress: handleAlertGoing }, { text: 'OK' }],
      );
    }
  }, [postSos]);

  const callNumber = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Error', 'No se puede hacer la llamada desde este dispositivo.'),
    );
  }, []);

  const selectedTypeLabel = useMemo(
    () => EMERGENCY_TYPES.find((t) => t.id === emergencyType)?.label ?? 'Otra',
    [emergencyType],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={HERO_RED} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar SOS">
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="warning" size={22} color="#FFD253" />
          <Text style={styles.headerTitle}>Emergencia · SOS</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 1 — ECU 911 */}
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: HERO_RED }]} onPress={handleCall911} activeOpacity={0.82}>
          <View style={styles.actionIcon}>
            <Ionicons name="call" size={26} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>ECU 911</Text>
            <Text style={styles.actionSub}>Llamada directa a emergencias</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* 2 — Notificar contactos */}
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#FF4C41' }]} onPress={handleNotifyContacts} activeOpacity={0.82}>
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={26} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Notificar contactos</Text>
            <Text style={styles.actionSub}>Envía tu ubicación a familia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* 3 — Soporte Going App */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: result === 'success' ? '#16A34A' : '#991B1B' }]}
          onPress={handleAlertGoing}
          disabled={sending || result === 'success'}
          activeOpacity={0.82}
        >
          <View style={styles.actionIcon}>
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : result === 'success' ? (
              <Ionicons name="checkmark" size={26} color="#fff" />
            ) : (
              <Ionicons name="shield-checkmark" size={26} color="#fff" />
            )}
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>{result === 'success' ? '✓ Alerta enviada' : 'Soporte Going App'}</Text>
            <Text style={styles.actionSub}>
              {result === 'success' ? 'Equipo de seguridad notificado' : sending ? 'Enviando alerta...' : 'Equipo de seguridad Going App'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tipo de emergencia */}
        <Text style={styles.sectionTitle}>Tipo de emergencia · {selectedTypeLabel}</Text>
        <View style={styles.typeGrid}>
          {EMERGENCY_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeOpt, emergencyType === t.id && styles.typeOptActive]}
              onPress={() => setEmergencyType(t.id)}
              activeOpacity={0.85}
            >
              <Ionicons name={t.icon} size={18} color={emergencyType === t.id ? HERO_RED : '#6B7280'} />
              <Text style={[styles.typeOptLbl, emergencyType === t.id && styles.typeOptLblActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Descripción opcional */}
        <Text style={styles.descLabel}>Descripción (opcional)</Text>
        <TextInput
          style={styles.descInput}
          placeholder="Describe brevemente la situación..."
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />

        {/* Otros números */}
        <Text style={styles.sectionTitle}>Otros números de emergencia</Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_NUMBERS.map((item) => (
            <TouchableOpacity key={item.number} style={styles.emergencyCard} onPress={() => callNumber(item.number)} activeOpacity={0.75}>
              <View style={[styles.emergencyIconBg, { backgroundColor: `${item.accent}18` }]}>
                <Ionicons name={item.icon} size={22} color={item.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyLabel}>{item.label}</Text>
                <Text style={[styles.emergencyNumber, { color: item.accent }]}>{item.number}</Text>
              </View>
              <Ionicons name="call-outline" size={18} color={item.accent} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.legalNote}>
          Going App no reemplaza a los servicios de emergencia oficiales. En caso de peligro inmediato llama al 911.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: HERO_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  body: { padding: 20, paddingBottom: 40 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  actionSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: 22,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeOptActive: { borderColor: HERO_RED, backgroundColor: `${HERO_RED}10` },
  typeOptLbl: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  typeOptLblActive: { color: HERO_RED, fontWeight: '800' },
  descLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  descInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emergencyGrid: { gap: 8, marginBottom: 20 },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emergencyIconBg: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emergencyLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  emergencyNumber: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  legalNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16, paddingHorizontal: 20 },
});
