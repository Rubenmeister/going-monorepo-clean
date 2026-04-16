import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';

// ── Tipos ──────────────────────────────────────────────────────────────────────
export interface SosParams {
  rideId?: string;
  driverName?: string;
  driverPlate?: string;
  driverPhone?: string;
  originAddress?: string;
  destinationAddress?: string;
  currentLat?: number;
  currentLng?: number;
}

type SosNavProp = NativeStackNavigationProp<MainStackParamList, 'Sos'>;
type SosRouteProp = RouteProp<MainStackParamList, 'Sos'>;

// ── Constantes ─────────────────────────────────────────────────────────────────
const GOING_BLUE   = '#0033A0';
const GOING_RED    = '#ef4444';
const GOING_YELLOW = '#FFCD00';

const EMERGENCY_NUMBERS = [
  { label: 'ECU911',            number: '911',       icon: 'call',         color: GOING_RED  },
  { label: 'Policía Nacional',  number: '101',       icon: 'shield',       color: '#dc2626'  },
  { label: 'Cruz Roja',         number: '131',       icon: 'medkit',       color: '#ef4444'  },
  { label: 'Bomberos',          number: '102',       icon: 'flame',        color: '#f97316'  },
];

// ── Pantalla SOS ───────────────────────────────────────────────────────────────
export function SosScreen() {
  const navigation = useNavigation<SosNavProp>();
  const route      = useRoute<SosRouteProp>();
  const {
    rideId,
    driverName,
    driverPlate,
    driverPhone,
    originAddress,
    destinationAddress,
    currentLat,
    currentLng,
  } = route.params ?? {};

  const [alertSent, setAlertSent] = useState(false);

  // ── Llamar número de emergencia ──────────────────────────────────────────────
  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Error', 'No se puede hacer la llamada desde este dispositivo.')
    );
  };

  // ── Compartir ubicación/info del viaje ───────────────────────────────────────
  const shareRideInfo = async () => {
    const mapsLink =
      currentLat && currentLng
        ? `https://maps.google.com/?q=${currentLat},${currentLng}`
        : '';

    const msg = [
      '🆘 *ALERTA DE SEGURIDAD - Going*',
      '',
      rideId        ? `🔑 Viaje: ${rideId.slice(0, 8).toUpperCase()}` : null,
      driverName    ? `👤 Conductor: ${driverName}`                    : null,
      driverPlate   ? `🚗 Placa: ${driverPlate}`                       : null,
      originAddress ? `📍 Origen: ${originAddress}`                    : null,
      destinationAddress ? `🏁 Destino: ${destinationAddress}`         : null,
      mapsLink      ? `📌 Ubicación actual: ${mapsLink}`               : null,
      '',
      'Enviado desde la app Going.',
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({ message: msg });
  };

  // ── Enviar alerta (simula notificación backend) ──────────────────────────────
  const sendGoingAlert = () => {
    // TODO: llamar endpoint POST /api/rides/:rideId/sos cuando el backend lo soporte
    setAlertSent(true);
    Alert.alert(
      '🆘 Alerta enviada',
      'Going ha recibido tu alerta. Un agente de seguridad revisará tu viaje en este momento.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={GOING_RED} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require('../../../assets/going-logo-horizontal-white.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Ionicons name="warning" size={22} color={GOING_YELLOW} style={{ marginLeft: 4 }} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Botón principal: alertar a Going */}
        <TouchableOpacity
          style={[styles.goingAlertBtn, alertSent && styles.goingAlertBtnSent]}
          onPress={sendGoingAlert}
          disabled={alertSent}
          activeOpacity={0.8}
        >
          <Ionicons
            name={alertSent ? 'checkmark-circle' : 'alert-circle'}
            size={36}
            color="#fff"
          />
          <Text style={styles.goingAlertBtnText}>
            {alertSent ? '✓ Alerta enviada a Going' : 'Alertar a Going'}
          </Text>
          {!alertSent && (
            <Text style={styles.goingAlertBtnSub}>
              Notifica a nuestro equipo de seguridad
            </Text>
          )}
        </TouchableOpacity>

        {/* Compartir info del viaje */}
        <TouchableOpacity style={styles.shareBtn} onPress={shareRideInfo} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={22} color={GOING_BLUE} />
          <Text style={styles.shareBtnText}>Compartir info del viaje con un contacto</Text>
        </TouchableOpacity>

        {/* Info del viaje activo */}
        {(driverName || driverPlate) && (
          <View style={styles.rideInfoCard}>
            <Text style={styles.rideInfoTitle}>Tu viaje actual</Text>
            {driverName  && <Text style={styles.rideInfoRow}>👤 {driverName}</Text>}
            {driverPlate && <Text style={styles.rideInfoRow}>🚗 Placa: {driverPlate}</Text>}
            {originAddress      && <Text style={styles.rideInfoRow} numberOfLines={1}>📍 {originAddress}</Text>}
            {destinationAddress && <Text style={styles.rideInfoRow} numberOfLines={1}>🏁 {destinationAddress}</Text>}
          </View>
        )}

        {/* Números de emergencia */}
        <Text style={styles.sectionTitle}>Números de emergencia Ecuador</Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_NUMBERS.map(item => (
            <TouchableOpacity
              key={item.number}
              style={[styles.emergencyCard, { borderLeftColor: item.color }]}
              onPress={() => callNumber(item.number)}
              activeOpacity={0.75}
            >
              <View style={[styles.emergencyIconBg, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyLabel}>{item.label}</Text>
                <Text style={[styles.emergencyNumber, { color: item.color }]}>{item.number}</Text>
              </View>
              <Ionicons name="call-outline" size={18} color={item.color} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Nota legal */}
        <Text style={styles.legalNote}>
          Going no reemplaza a los servicios de emergencia oficiales. En caso de peligro inmediato llama al 911.
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    backgroundColor: GOING_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLogo:   { width: 90, height: 34 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },

  body: { padding: 20, paddingBottom: 40 },

  // Botón alertar a Going
  goingAlertBtn: {
    backgroundColor: GOING_RED,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    shadowColor: GOING_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  goingAlertBtnSent:    { backgroundColor: '#16a34a' },
  goingAlertBtnText:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  goingAlertBtnSub:     { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  // Compartir
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${GOING_BLUE}30`,
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: GOING_BLUE, flex: 1 },

  // Info del viaje
  rideInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  rideInfoTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  rideInfoRow:   { fontSize: 13, color: '#6b7280' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grilla emergencias
  emergencyGrid: { gap: 10, marginBottom: 24 },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyIconBg: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emergencyInfo:   { flex: 1 },
  emergencyLabel:  { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  emergencyNumber: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },

  legalNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});
