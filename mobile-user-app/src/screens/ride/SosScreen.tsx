/**
 * SosScreen — Emergencia / SOS (Mockup #13).
 *
 * Las 3 acciones equivalentes del mockup:
 *   1. ECU 911    → tel:911 directo (+ POST /sos background con
 *                   emergencyDialerTriggered:true para que ops sepa)
 *   2. Notificar contactos → Share native (WhatsApp/SMS/etc) con info viaje
 *   3. Soporte Going → POST /sos al emergency-service nuevo → ops Telegram
 *
 * Plus:
 *   - Selector emergencyType collapsible (medical/accident/robbery/...)
 *   - Description opcional (hasta 500 chars)
 *   - Refresh GPS antes de enviar (más preciso que coord cached)
 *   - 4 números EC en grilla (Policía, Cruz Roja, Bomberos, ECU911)
 *   - Card con info del viaje activo
 *
 * REFIT 2026-05-23 (task #40 backend + Day 7 api-gateway routing):
 *   Antes: usaba transportAPI.sosAlert → POST /rides/:rideId/sos legacy.
 *   Ahora: usa emergencyAPI.createSos → POST /sos del emergency-service
 *          nuevo (persiste incident en MongoDB + notifica ops Telegram
 *          con priority RED + map link + GPS accuracy).
 *
 * Theme: bg ROJO se MANTIENE siempre (identity de emergencia — momento
 * crítico, no debe cambiar por dark/light). Otros elementos sí usan theme.
 */
import React, { useState, useMemo, useCallback } from 'react';
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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import { emergencyAPI } from '../../services/api';
import { hapticHeavy, hapticSuccess, hapticError } from '../../utils/haptics';
import { useTheme, type ThemeTokens } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface SosParams {
  rideId?:             string;
  driverName?:         string;
  driverPlate?:        string;
  driverPhone?:        string;
  originAddress?:      string;
  destinationAddress?: string;
  currentLat?:         number;
  currentLng?:         number;
}

type SosNavProp   = NativeStackNavigationProp<MainStackParamList, 'Sos'>;
type SosRouteProp = RouteProp<MainStackParamList, 'Sos'>;

type EmergencyType = NonNullable<Parameters<typeof emergencyAPI.createSos>[0]['emergencyType']>;

const EMERGENCY_TYPES: Array<{ id: EmergencyType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { id: 'medical',           label: 'Médica',              icon: 'medkit'           },
  { id: 'accident',          label: 'Accidente',           icon: 'car'              },
  { id: 'robbery',           label: 'Robo / Asalto',       icon: 'alert-circle'     },
  { id: 'harassment',        label: 'Acoso / Amenaza',     icon: 'warning'          },
  { id: 'vehicle_breakdown', label: 'Vehículo averiado',   icon: 'construct'        },
  { id: 'other',             label: 'Otra emergencia',     icon: 'help-circle'      },
];

const EMERGENCY_NUMBERS = [
  { label: 'ECU 911',           number: '911', icon: 'call'    as const, accent: '#dc2626' },
  { label: 'Policía Nacional',  number: '101', icon: 'shield'  as const, accent: '#1e40af' },
  { label: 'Cruz Roja',         number: '131', icon: 'medkit'  as const, accent: '#dc2626' },
  { label: 'Bomberos',          number: '102', icon: 'flame'   as const, accent: '#ea580c' },
];

const HERO_RED      = '#DC2626';   // fondo header — siempre, no theme-adaptive
const HERO_RED_DARK = '#991B1B';

// ─────────────────────────────────────────────────────────────────────────────
export function SosScreen() {
  const navigation = useNavigation<SosNavProp>();
  const route      = useRoute<SosRouteProp>();
  const { user }   = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const {
    rideId,
    driverName,
    driverPlate,
    originAddress,
    destinationAddress,
    currentLat,
    currentLng,
  } = route.params ?? {};

  const [emergencyType, setEmergencyType] = useState<EmergencyType>('other');
  const [description,   setDescription]   = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [sendingSos,    setSendingSos]    = useState(false);
  const [sosResult,     setSosResult]     = useState<'idle' | 'success' | 'error'>('idle');
  const [emergencyDialerTriggered, setEmergencyDialerTriggered] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getFreshGPS = useCallback(async (): Promise<{ lat: number; lng: number; accuracyM?: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback a las coords cached del param (mejor que nada)
        return currentLat && currentLng
          ? { lat: currentLat, lng: currentLng }
          : null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,  // alta precisión — vale la pena en SOS
      });
      return {
        lat:       loc.coords.latitude,
        lng:       loc.coords.longitude,
        accuracyM: loc.coords.accuracy ?? undefined,
      };
    } catch {
      return currentLat && currentLng
        ? { lat: currentLat, lng: currentLng }
        : null;
    }
  }, [currentLat, currentLng]);

  const postSos = useCallback(async (extraFlags?: { emergencyDialerTriggered?: boolean }) => {
    if (!user?.id) {
      hapticError();
      Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para enviar la alerta.');
      return false;
    }
    const gps = await getFreshGPS();
    if (!gps) {
      hapticError();
      Alert.alert(
        'GPS requerido',
        'No pudimos obtener tu ubicación. Activa el GPS o concede permiso de ubicación e intenta de nuevo. Si es urgente, llama al 911 directamente.',
      );
      return false;
    }

    try {
      await emergencyAPI.createSos({
        userId:        user.id,
        channel:       'mobile',
        emergencyType,
        description:   description.trim() || undefined,
        location:      { lat: gps.lat, lng: gps.lng },
        accuracyM:     gps.accuracyM,
        rideId:        rideId,
        emergencyDialerTriggered: extraFlags?.emergencyDialerTriggered ?? emergencyDialerTriggered,
      });
      return true;
    } catch (err) {
      // Side-effect failure no debe bloquear UI — el 911 y Share siguen
      // funcionando en paralelo. Log a console + return false.
      console.warn('[SOS] backend createSos failed:', err);
      return false;
    }
  }, [user?.id, emergencyType, description, rideId, emergencyDialerTriggered, getFreshGPS]);

  // ── Acción 1: ECU 911 (llamada directa + tracking opcional) ────────────
  const handleCall911 = useCallback(async () => {
    hapticHeavy();
    setEmergencyDialerTriggered(true);

    // 1. Abrir dialer inmediatamente — prioridad absoluta sobre cualquier API call
    Linking.openURL('tel:911').catch(() =>
      Alert.alert('Error', 'No se puede hacer la llamada desde este dispositivo.'),
    );

    // 2. En background, notificar a ops Going que el cliente llamó al 911
    //    (para coordinar con autoridades). Sin bloquear UI.
    postSos({ emergencyDialerTriggered: true })
      .then((ok) => {
        if (ok) console.log('[SOS] ops notified — user dialed 911');
      })
      .catch(() => {});
  }, [postSos]);

  // ── Acción 2: Notificar contactos (Share native) ───────────────────────
  const handleNotifyContacts = useCallback(async () => {
    hapticHeavy();
    const mapsLink = currentLat && currentLng
      ? `https://maps.google.com/?q=${currentLat},${currentLng}`
      : '';

    const msg = [
      '🆘 *ALERTA DE SEGURIDAD - Going*',
      '',
      'Te comparto mi ubicación y datos del viaje en curso.',
      '',
      rideId             ? `🔑 Viaje: ${rideId.slice(0, 8).toUpperCase()}` : null,
      driverName         ? `👤 Conductor: ${driverName}`                    : null,
      driverPlate        ? `🚗 Placa: ${driverPlate}`                       : null,
      originAddress      ? `📍 Origen: ${originAddress}`                    : null,
      destinationAddress ? `🏁 Destino: ${destinationAddress}`              : null,
      mapsLink           ? `📌 Ubicación actual: ${mapsLink}`               : null,
      '',
      'Enviado desde la app Going.',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: msg, title: 'Alerta Going' });
    } catch {
      // user canceled — silent
    }
  }, [rideId, driverName, driverPlate, originAddress, destinationAddress, currentLat, currentLng]);

  // ── Acción 3: Alertar a Going (POST /sos al emergency-service) ─────────
  const handleAlertGoing = useCallback(async () => {
    hapticHeavy();
    setSendingSos(true);
    const ok = await postSos();
    setSendingSos(false);
    if (ok) {
      hapticSuccess();
      setSosResult('success');
      Alert.alert(
        '🆘 Alerta enviada',
        'Going recibió tu alerta. Un agente de seguridad la está revisando ahora y se coordinará con autoridades si es necesario.',
        [{ text: 'OK' }],
      );
    } else {
      hapticError();
      setSosResult('error');
      Alert.alert(
        'Error de red',
        'No pudimos enviar la alerta al servidor. Por favor llama al 911 directamente o notifica a tus contactos. Reintenta en unos segundos.',
        [
          { text: 'Reintentar', onPress: handleAlertGoing },
          { text: 'OK' },
        ],
      );
    }
  }, [postSos]);

  const callNumber = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Error', 'No se puede hacer la llamada desde este dispositivo.'),
    );
  }, []);

  const toggleTypePicker = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTypePicker(p => !p);
  }, []);

  const selectedTypeLabel = EMERGENCY_TYPES.find(t => t.id === emergencyType)?.label ?? 'Otra';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={HERO_RED} />

      {/* ══ HEADER ROJO (siempre, no theme-adaptive) ═══════════════════════ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Cerrar pantalla SOS"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="warning" size={22} color="#FFD253" />
          <Text style={styles.headerTitle}>Emergencia · SOS</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ══ 3 ACCIONES PRINCIPALES (mockup #13) ═════════════════════════ */}

        {/* 1. ECU 911 — llamada directa */}
        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardCall]}
          onPress={handleCall911}
          activeOpacity={0.82}
          accessibilityLabel="Llamar al ECU 911"
        >
          <View style={[styles.actionIcon, styles.actionIconCall]}>
            <Ionicons name="call" size={26} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>ECU 911</Text>
            <Text style={styles.actionSub}>Llamada directa a emergencias</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* 2. Notificar contactos */}
        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardNotify]}
          onPress={handleNotifyContacts}
          activeOpacity={0.82}
          accessibilityLabel="Notificar a contactos con ubicación"
        >
          <View style={[styles.actionIcon, styles.actionIconNotify]}>
            <Ionicons name="people" size={26} color="#fff" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Notificar contactos</Text>
            <Text style={styles.actionSub}>Envía ubicación a familia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* 3. Soporte Going (POST /sos al emergency-service) */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            styles.actionCardGoing,
            sosResult === 'success' && styles.actionCardGoingSent,
          ]}
          onPress={handleAlertGoing}
          disabled={sendingSos || sosResult === 'success'}
          activeOpacity={0.82}
          accessibilityLabel="Alertar al equipo de seguridad Going"
        >
          <View style={[styles.actionIcon, styles.actionIconGoing]}>
            {sendingSos ? (
              <ActivityIndicator color="#fff" />
            ) : sosResult === 'success' ? (
              <Ionicons name="checkmark" size={26} color="#fff" />
            ) : (
              <Ionicons name="shield-checkmark" size={26} color="#fff" />
            )}
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              {sosResult === 'success' ? '✓ Alerta enviada' : 'Soporte Going'}
            </Text>
            <Text style={styles.actionSub}>
              {sosResult === 'success'
                ? 'Equipo de seguridad notificado'
                : sendingSos
                ? 'Enviando alerta...'
                : 'Equipo de seguridad Going'}
            </Text>
          </View>
          {!sendingSos && sosResult !== 'success' && (
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          )}
        </TouchableOpacity>

        {/* ── Tipo de emergencia (opcional pero útil para ops) ────────── */}
        <View style={styles.detailSection}>
          <TouchableOpacity
            style={styles.detailToggle}
            onPress={toggleTypePicker}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle-outline" size={20} color={tokens.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailToggleLbl}>Tipo de emergencia</Text>
              <Text style={styles.detailToggleVal}>{selectedTypeLabel}</Text>
            </View>
            <Ionicons
              name={showTypePicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={tokens.textTertiary}
            />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.typeGrid}>
              {EMERGENCY_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeOpt,
                    emergencyType === t.id && styles.typeOptActive,
                  ]}
                  onPress={() => {
                    setEmergencyType(t.id);
                    setShowTypePicker(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={emergencyType === t.id ? HERO_RED : tokens.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptLbl,
                      emergencyType === t.id && styles.typeOptLblActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Descripción opcional ────────────────────────────────────── */}
        <View style={styles.detailSection}>
          <Text style={styles.descLabel}>
            Descripción <Text style={styles.descLabelOpt}>(opcional)</Text>
          </Text>
          <TextInput
            style={styles.descInput}
            placeholder="Describe brevemente la situación..."
            placeholderTextColor={tokens.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
          <Text style={styles.descCount}>{description.length}/500</Text>
        </View>

        {/* ── Info del viaje activo ───────────────────────────────────── */}
        {(driverName || driverPlate) && (
          <View style={styles.rideInfoCard}>
            <Text style={styles.rideInfoTitle}>Tu viaje actual</Text>
            {driverName && <Text style={styles.rideInfoRow}>👤 {driverName}</Text>}
            {driverPlate && <Text style={styles.rideInfoRow}>🚗 Placa: {driverPlate}</Text>}
            {originAddress && <Text style={styles.rideInfoRow} numberOfLines={1}>📍 {originAddress}</Text>}
            {destinationAddress && <Text style={styles.rideInfoRow} numberOfLines={1}>🏁 {destinationAddress}</Text>}
            {rideId && (
              <Text style={styles.rideInfoRefId}>Ref: {rideId.slice(0, 8).toUpperCase()}</Text>
            )}
          </View>
        )}

        {/* ── Otros números de emergencia ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Otros números de emergencia</Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_NUMBERS.map(item => (
            <TouchableOpacity
              key={item.number}
              style={styles.emergencyCard}
              onPress={() => callNumber(item.number)}
              activeOpacity={0.75}
            >
              <View style={[styles.emergencyIconBg, { backgroundColor: `${item.accent}18` }]}>
                <Ionicons name={item.icon} size={22} color={item.accent} />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyLabel}>{item.label}</Text>
                <Text style={[styles.emergencyNumber, { color: item.accent }]}>{item.number}</Text>
              </View>
              <Ionicons name="call-outline" size={18} color={item.accent} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Nota legal ──────────────────────────────────────────────── */}
        <Text style={styles.legalNote}>
          Going no reemplaza a los servicios de emergencia oficiales. En caso de peligro inmediato llama al 911.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },

    // ── Header rojo (NO theme-adaptive — siempre rojo) ─────
    header: {
      backgroundColor: HERO_RED,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 52,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    backBtn: {
      width: 40, height: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    headerTitle: {
      fontSize: 16, fontWeight: '900',
      color: '#fff', letterSpacing: 0.3,
    },

    body: { padding: 20, paddingBottom: 40 },

    // ── 3 ACCIONES PRINCIPALES ─────────────────────────────
    actionCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, padding: 16, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
    },
    actionCardCall:   { backgroundColor: HERO_RED },
    actionCardNotify: { backgroundColor: '#FF4C41' },  // navy (brand action)
    actionCardGoing:  { backgroundColor: HERO_RED_DARK },
    actionCardGoingSent: { backgroundColor: '#16A34A' },  // success green
    actionIcon: {
      width: 52, height: 52, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    actionIconCall:   { backgroundColor: 'rgba(255,255,255,0.18)' },
    actionIconNotify: { backgroundColor: 'rgba(255,255,255,0.18)' },
    actionIconGoing:  { backgroundColor: 'rgba(255,255,255,0.18)' },
    actionInfo: { flex: 1 },
    actionTitle: {
      fontSize: 16, fontWeight: '900',
      color: '#fff', letterSpacing: -0.3,
    },
    actionSub: {
      fontSize: 12, fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },

    // ── Detail sections (tipo, descripción) ────────────────
    detailSection: { marginTop: 14 },
    detailToggle: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: t.bgLayer,
      borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    detailToggleLbl: {
      fontSize: 11, fontWeight: '700',
      color: t.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    detailToggleVal: {
      fontSize: 14, fontWeight: '800',
      color: t.textPrimary, marginTop: 2,
    },

    typeGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      marginTop: 10,
    },
    typeOpt: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: t.bgLayer,
      borderWidth: 1.5, borderColor: t.glassBorder,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    },
    typeOptActive: {
      borderColor: HERO_RED,
      backgroundColor: `${HERO_RED}10`,
    },
    typeOptLbl: {
      fontSize: 12, fontWeight: '700',
      color: t.textSecondary,
    },
    typeOptLblActive: {
      color: HERO_RED,
      fontWeight: '800',
    },

    descLabel: {
      fontSize: 11, fontWeight: '700',
      color: t.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 6,
    },
    descLabelOpt: { color: t.textTertiary, fontWeight: '500' },
    descInput: {
      backgroundColor: t.bgLayer,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 12, padding: 12,
      fontSize: 14, color: t.textPrimary,
      minHeight: 80, textAlignVertical: 'top',
    },
    descCount: {
      fontSize: 10, color: t.textTertiary,
      textAlign: 'right', marginTop: 4,
    },

    // ── Ride info card ─────────────────────────────────────
    rideInfoCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 12, padding: 14,
      marginTop: 18,
      borderWidth: 1, borderColor: t.glassBorder,
      gap: 4,
    },
    rideInfoTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 6,
    },
    rideInfoRow: {
      fontSize: 13, color: t.textSecondary, fontWeight: '600',
    },
    rideInfoRefId: {
      fontSize: 10, color: t.textTertiary,
      marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // ── Otros números ─────────────────────────────────────
    sectionTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      marginTop: 22, marginBottom: 10,
      textTransform: 'uppercase', letterSpacing: 0.8,
    },
    emergencyGrid: { gap: 8, marginBottom: 20 },
    emergencyCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.bgLayer,
      borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    emergencyIconBg: {
      width: 42, height: 42, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    emergencyInfo: { flex: 1 },
    emergencyLabel: {
      fontSize: 13, fontWeight: '700', color: t.textPrimary,
    },
    emergencyNumber: {
      fontSize: 16, fontWeight: '900', letterSpacing: 1,
    },

    legalNote: {
      fontSize: 11, color: t.textTertiary,
      textAlign: 'center', lineHeight: 16,
      paddingHorizontal: 20,
    },
  });
}
