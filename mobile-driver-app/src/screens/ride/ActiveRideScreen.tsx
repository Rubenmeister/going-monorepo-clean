import React, { Fragment, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Share } from 'react-native';
import axios from 'axios';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { hapticMedium } from '../../utils/haptics';
import { resolveCallSession, startPSTNCall } from '../../utils/agoraCall';
import type { CallSession } from '../../utils/agoraCall';
import { InCallOverlay } from '../../components/InCallOverlay';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSPORT_WS =
  process.env.EXPO_PUBLIC_TRANSPORT_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';

type Route = RouteProp<DriverMainStackParamList, 'ActiveRide'>;

const STEPS = ['Camino al pasajero', 'Pasajero a bordo', 'Viaje completado'];

const PAYMENT_LABELS: Record<string, string> = {
  cash:   'Efectivo',
  card:   'Tarjeta',
  wallet: 'Going App Credits',
};
const PAYMENT_ICONS: Record<string, string> = {
  cash:   'cash-outline',
  card:   'card-outline',
  wallet: 'wallet-outline',
};

/** Distancia aproximada en metros (equirectangular, suficiente para <1 km). */
function metersBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = (b.latitude - a.latitude) * 111320;
  const dLng = (b.longitude - a.longitude) * 111320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// RideCheck: si el viaje (pasajero a bordo) lleva detenido más de esto, preguntamos "¿todo bien?".
const RIDECHECK_STOP_MS = 4 * 60 * 1000;
const RIDECHECK_MOVE_M = 35;

export function ActiveRideScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { rideId, passengerName, destination, paymentMethod = 'card', fare = 0 } = params;
  const mapRef    = useRef<MapboxGL.MapView>(null);
  const socketRef = useRef<Socket | null>(null);
  const [driverLoc, setDriverLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [step, setStep]               = useState(0);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const rideStartTimestamp = useRef<number | null>(null);

  // RideCheck (chequeo de seguridad por parada prolongada con pasajero a bordo)
  const [rideCheckVisible, setRideCheckVisible] = useState(false);
  const lastMoveRef = useRef<{ latitude: number; longitude: number; t: number } | null>(null);
  const stepRef = useRef(0);
  useEffect(() => { stepRef.current = step; }, [step]);

  // PIN verificación de pasajero al subir
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput]               = useState('');
  const [pinError, setPinError]               = useState<string | null>(null);
  const [pinVerifying, setPinVerifying]       = useState(false);

  const verifyPickupCode = async () => {
    if (pinVerifying) return;
    const code = pinInput.trim();
    if (code.length !== 6) {
      setPinError('El código tiene 6 dígitos.');
      return;
    }
    setPinVerifying(true);
    setPinError(null);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      await axios.post(
        `${API_BASE}/rides/${rideId}/verify-pickup`,
        { code },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 8000 },
      );
      // OK — cerrar modal y avanzar a "Pasajero a bordo"
      setPinModalVisible(false);
      setPinInput('');
      setStep(1);
      rideStartTimestamp.current = Date.now();
      socketRef.current?.emit('driver:started', { rideId });
    } catch (e: any) {
      setPinError(
        e?.response?.data?.message ||
          'Código inválido. Pídele al pasajero el código que ve en su pantalla.',
      );
    } finally {
      setPinVerifying(false);
    }
  };

  const handleCallPassenger = async () => {
    if (callLoading) return;
    hapticMedium();
    setCallLoading(true);
    try {
      const session = await resolveCallSession(rideId);
      if (!session) {
        Alert.alert('Sin conexión', 'No se pudo establecer la llamada. Intenta de nuevo.');
        return;
      }
      if (session.type === 'agora') {
        setCallSession(session);
      } else {
        startPSTNCall(session.proxyNumber!);
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener el número del pasajero.');
    } finally {
      setCallLoading(false);
    }
  };

  // ─── WebSocket: conectar al transport-service y unirse a la sala del viaje ─
  useEffect(() => {
    let socketInstance: Socket | null = null;

    AsyncStorage.getItem('driver_token').then((token) => {
      socketInstance = io(`${TRANSPORT_WS}/rides`, {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
      });
      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        socketInstance?.emit('join:ride', { rideId });
      });
    });

    return () => {
      socketInstance?.disconnect();
      socketRef.current = null;
    };
  }, [rideId]);

  // ─── GPS: observar posición y emitir al servidor cada 5 s / 10 m ──────────
  useEffect(() => {
    let mounted = true;
    const sub = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        if (!mounted) return;
        const { latitude, longitude, heading, speed } = loc.coords;
        setDriverLoc({ latitude, longitude });

        // RideCheck: registrar último movimiento significativo (para detectar paradas prolongadas).
        const prev = lastMoveRef.current;
        if (!prev || metersBetween(prev, { latitude, longitude }) > RIDECHECK_MOVE_M) {
          lastMoveRef.current = { latitude, longitude, t: Date.now() };
        }

        // Emitir posición al pasajero vía WebSocket
        socketRef.current?.emit('driver:location', {
          rideId,
          lat: latitude,
          lng: longitude,
          heading: heading ?? undefined,
          speed:   speed   ?? undefined,
        });
      }
    );
    return () => {
      try {
        mounted = false;
        sub.then((s) => s.remove());
      } catch {
        // Silencio si la limpieza falla
      }
    };
  }, []);

  // ─── RideCheck: parada prolongada con pasajero a bordo → "¿todo bien?" ─────
  useEffect(() => {
    const id = setInterval(() => {
      if (stepRef.current !== 1) return;        // solo con pasajero a bordo
      if (rideCheckVisible) return;             // ya estamos preguntando
      const lm = lastMoveRef.current;
      if (lm && Date.now() - lm.t > RIDECHECK_STOP_MS) {
        hapticMedium();
        setRideCheckVisible(true);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [rideCheckVisible]);

  // ─── Compartir viaje con un contacto de confianza (seguridad) ─────────────
  const handleShareTrip = async () => {
    hapticMedium();
    const here = driverLoc
      ? `https://maps.google.com/?q=${driverLoc.latitude},${driverLoc.longitude}`
      : '';
    const msg = [
      '🚗 Estoy haciendo un viaje con Going App. Te comparto mis datos por seguridad.',
      '',
      passengerName ? `Pasajera/o: ${passengerName}` : null,
      destination ? `Destino: ${destination}` : null,
      rideId ? `Viaje: ${rideId.slice(0, 8).toUpperCase()}` : null,
      here ? `Mi ubicación ahora: ${here}` : null,
      '',
      'Si no tienes noticias mías en un rato, llámame.',
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: msg, title: 'Mi viaje — Going App' });
    } catch {
      // compartir cancelado
    }
  };

  const completeRide = (cashConfirmed = false) => {
    // distanceKm: usa la distancia real calculada desde la ruta GPS si está disponible,
    // o el valor del parámetro si lo proveyó el backend al aceptar el viaje.
    // durationSeconds: tiempo real desde que se inició el viaje (step 1).
    const distKm  = (fare && fare > 0) ? fare / 2.5 : 5; // estimado provisional
    const durSecs = Math.max(1, Math.round((Date.now() - (rideStartTimestamp.current ?? Date.now())) / 1000));
    socketRef.current?.emit('driver:completed', {
      rideId,
      distanceKm:      distKm,
      durationSeconds: durSecs,
      // cashConfirmed se envía como metadata informativa; el backend actualmente lo ignora.
      // Se deberá agregar manejo en ride-events.gateway cuando se implemente el endpoint de ganancias.
      ...(cashConfirmed && { cashConfirmed: true }),
    });
    Alert.alert(
      '¡Viaje completado! 🎉',
      cashConfirmed
        ? `Efectivo confirmado · $${fare.toFixed(2)}\n¡Excelente trabajo! Los pasajeros pueden calificarte ahora.`
        : `¡Excelente trabajo! Los pasajeros pueden calificarte ahora.`,
      [
        {
          text: 'Ver mis ganancias',
          onPress: () => (navigation as any).navigate('Wallet'),
        },
        {
          text: 'Nuevo viaje',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const confirmCashAndComplete = () => {
    Alert.alert(
      '💵 Confirmar cobro en efectivo',
      `¿Recibiste $${fare.toFixed(2)} en efectivo del pasajero?`,
      [
        { text: 'No recibí el pago', style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Pago pendiente',
              'Contacta al soporte de Going App si el pasajero se negó a pagar.',
              [{ text: 'Entendido' }]
            ),
        },
        {
          text: `Sí, recibí $${fare.toFixed(2)}`,
          onPress: () => {
            setCashConfirmed(true);
            completeRide();
          },
        },
      ]
    );
  };

  const advance = () => {
    hapticMedium();
    // Step 0 → 1 (pasajero a bordo): PIN obligatorio. El advance lo dispara
    // verifyPickupCode al validar contra backend.
    if (step === 0) {
      socketRef.current?.emit('driver:arrived', { rideId });
      setPinModalVisible(true);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      if (step === 1) {
        rideStartTimestamp.current = Date.now();
        socketRef.current?.emit('driver:started', { rideId });
      }
    } else {
      // Último paso — verificar pago en efectivo
      if (paymentMethod === 'cash') {
        confirmCashAndComplete();
      } else {
        completeRide();
      }
    }
  };

  return (
    <Fragment>
    <View style={styles.container}>
      <MapboxGL.MapView ref={mapRef} style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={[-78.4678, -0.1807]}
          animationMode="none"
        />
        <MapboxGL.UserLocation visible={true} />
      </MapboxGL.MapView>

      <View style={styles.infoPanel}>
        {/* Step progress */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text
                style={[styles.stepText, i === step && styles.stepTextActive]}
              >
                {s}
              </Text>
            </View>
          ))}
        </View>

        {/* Passenger info */}
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#FF4C41" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>
              {passengerName || 'Pasajero'}
            </Text>
            <Text style={styles.destination} numberOfLines={1}>
              → {destination}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, callLoading && { opacity: 0.5 }]}
            onPress={handleCallPassenger}
            disabled={callLoading}
          >
            <Ionicons name={callLoading ? 'hourglass-outline' : 'call-outline'} size={20} color="#FF4C41" />
          </TouchableOpacity>
        </View>

        {/* Badge de pago */}
        <View style={[
          styles.paymentBadge,
          paymentMethod === 'cash' && styles.paymentBadgeCash,
        ]}>
          <Ionicons
            name={PAYMENT_ICONS[paymentMethod] as any}
            size={16}
            color={paymentMethod === 'cash' ? '#065F46' : '#FF4C41'}
          />
          <Text style={[
            styles.paymentLabel,
            paymentMethod === 'cash' && styles.paymentLabelCash,
          ]}>
            {PAYMENT_LABELS[paymentMethod]}
          </Text>
          {fare > 0 && (
            <Text style={[
              styles.paymentFare,
              paymentMethod === 'cash' && styles.paymentLabelCash,
            ]}>
              · ${fare.toFixed(2)}
            </Text>
          )}
          {paymentMethod === 'cash' && (
            <Text style={styles.paymentCashNote}>— Cobra al llegar</Text>
          )}
        </View>

        {/* Seguridad: compartir viaje + SOS (siempre accesibles durante el viaje) */}
        <View style={styles.safetyRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareTrip}>
            <Ionicons name="share-social-outline" size={18} color="#374151" />
            <Text style={styles.shareBtnText}>Compartir viaje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sosBtn}
            onPress={() => (navigation as any).navigate('DriverSos')}
          >
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.sosBtnText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            step === STEPS.length - 1 && styles.nextBtnDone,
          ]}
          onPress={advance}
        >
          <Text style={styles.nextBtnText}>
            {step < STEPS.length - 1 ? STEPS[step + 1] : 'Finalizar viaje'}
          </Text>
          <Ionicons
            name={
              step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark-circle'
            }
            size={20}
            color="#FF4C41"
          />
        </TouchableOpacity>
      </View>
    </View>

    {callSession?.type === 'agora' && (
      <InCallOverlay
        session={callSession}
        otherPersonName={passengerName || 'Pasajero'}
        onCallEnd={() => setCallSession(null)}
      />
    )}

    <Modal
      visible={pinModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => !pinVerifying && setPinModalVisible(false)}
    >
      <View style={pinStyles.overlay}>
        <View style={pinStyles.card}>
          <Text style={pinStyles.title}>Código del pasajero</Text>
          <Text style={pinStyles.subtitle}>
            Pídele al pasajero que te diga los 6 dígitos de su pantalla. Ingresa
            el código para confirmar que es la persona correcta y arrancar el viaje.
          </Text>
          <TextInput
            style={pinStyles.input}
            value={pinInput}
            onChangeText={(t) => { setPinInput(t.replace(/\D/g, '').slice(0, 6)); setPinError(null); }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="——————"
            placeholderTextColor="#D1D5DB"
            autoFocus
            editable={!pinVerifying}
          />
          {pinError && <Text style={pinStyles.error}>{pinError}</Text>}
          <View style={pinStyles.btnRow}>
            <TouchableOpacity
              style={pinStyles.btnSecondary}
              onPress={() => { setPinModalVisible(false); setPinInput(''); setPinError(null); }}
              disabled={pinVerifying}
            >
              <Text style={pinStyles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.btnPrimary}
              onPress={verifyPickupCode}
              disabled={pinVerifying || pinInput.length !== 6}
            >
              {pinVerifying
                ? <ActivityIndicator color="#FF4C41" />
                : <Text style={pinStyles.btnPrimaryText}>Verificar y arrancar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* RideCheck — chequeo de seguridad por parada prolongada */}
    <Modal
      visible={rideCheckVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setRideCheckVisible(false)}
    >
      <View style={pinStyles.overlay}>
        <View style={pinStyles.card}>
          <Text style={pinStyles.title}>¿Todo bien? 🛡️</Text>
          <Text style={pinStyles.subtitle}>
            Notamos que el viaje lleva un rato detenido. ¿Está todo en orden?
          </Text>
          <View style={pinStyles.btnRow}>
            <TouchableOpacity
              style={pinStyles.btnSecondary}
              onPress={() => {
                lastMoveRef.current = driverLoc ? { ...driverLoc, t: Date.now() } : null;
                setRideCheckVisible(false);
              }}
            >
              <Text style={pinStyles.btnSecondaryText}>Sí, todo bien</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pinStyles.btnPrimary, { backgroundColor: '#DC2626' }]}
              onPress={() => { setRideCheckVisible(false); (navigation as any).navigate('DriverSos'); }}
            >
              <Text style={[pinStyles.btnPrimaryText, { color: '#fff' }]}>Necesito ayuda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </Fragment>
  );
}

// ── PIN modal styles ───────────────────────────────────────────────────────
const pinStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    width: '100%', maxWidth: 360,
  },
  title: { fontSize: 20, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 18 },
  input: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 18,
    fontSize: 28, fontWeight: '900', letterSpacing: 8,
    textAlign: 'center', color: '#1a1a1a',
  },
  error: { color: '#dc2626', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnPrimary: {
    flex: 1, backgroundColor: '#FFD253', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '900', color: '#FF4C41' },
  btnSecondary: {
    flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: '#374151' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoPanel: {
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: { backgroundColor: '#FF4C41', borderColor: '#FF4C41' },
  stepText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
  },
  stepTextActive: { color: '#FF4C41', fontWeight: '800' },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  destination: { fontSize: 12, color: '#6B7280', marginTop: 2, maxWidth: 200 },
  callBtn: {
    marginLeft: 'auto',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  nextBtn: {
    backgroundColor: '#FFD253',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDone: { backgroundColor: '#D1FAE5' },
  nextBtnText: { color: '#FF4C41', fontSize: 15, fontWeight: '900' },
  safetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
  },
  shareBtnText: { color: '#374151', fontSize: 14, fontWeight: '700' },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  sosBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  paymentBadgeCash: {
    backgroundColor: '#D1FAE5',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4C41',
  },
  paymentLabelCash: {
    color: '#065F46',
  },
  paymentFare: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF4C41',
  },
  paymentCashNote: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 2,
  },
});
